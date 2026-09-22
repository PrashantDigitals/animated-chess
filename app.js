import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

const game = new Chess();
const board = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const checkBadge = document.querySelector("#checkBadge");
const modal = document.querySelector("#promotionModal");
const animationLayer = document.querySelector("#animationLayer");

let selected = null, busy = false, pendingPromotion = null, orientation = "w";
const files = ["a","b","c","d","e","f","g","h"];
const glyph = {p:["♙","♟"],n:["♘","♞"],b:["♗","♝"],r:["♖","♜"],q:["♕","♛"],k:["♔","♚"]};

function sqAt(col,row){
  const f = orientation === "w" ? col : 7-col;
  const r = orientation === "w" ? 7-row : row;
  return files[f] + (8-r);
}
function elFor(sq){ return document.querySelector(`[data-square="${sq}"]`); }

function render(){
  board.innerHTML = "";
  const checkedKing = game.isCheck() ? findKing(game.turn()) : null;

  for(let row=0;row<8;row++){
    for(let col=0;col<8;col++){
      const sq=sqAt(col,row);
      const b=document.createElement("button");
      b.className=`square ${((row+col)%2===0)?"light":"dark"}`;
      b.dataset.square=sq;
      b.addEventListener("click",()=>tap(sq));
      if(selected===sq)b.classList.add("selected");
      if(checkedKing===sq)b.classList.add("in-check");

      const piece=game.get(sq);
      if(piece){
        const p=document.createElement("span");
        p.className=`piece ${piece.color==="w"?"white-piece":"black-piece"}`;
        if(piece.type==="n" && ((piece.color==="w"&&sq==="g1")||(piece.color==="b"&&sq==="b8"))){
          const img=document.createElement("img");
          img.className="knight-piece";img.src="knight.svg";img.alt="";
          if(piece.color==="b")img.style.filter="brightness(.34) saturate(.45)";
          p.appendChild(img);
        }else p.textContent=glyph[piece.type][piece.color==="w"?0:1];
        b.appendChild(p);
      }

      if(selected){
        const move=game.moves({square:selected,verbose:true}).find(m=>m.to===sq);
        if(move){b.classList.add("legal");if(move.captured)b.classList.add("capture")}
      }
      board.appendChild(b);
    }
  }

  if(game.isCheckmate())statusEl.textContent=`${game.turn()==="w"?"Black":"White"} wins — checkmate`;
  else if(game.isStalemate())statusEl.textContent="Draw — stalemate";
  else if(game.isDraw())statusEl.textContent="Draw";
  else {statusEl.textContent=game.turn()==="w"?"White to move":"Black to move";if(game.isCheck())statusEl.textContent+=" — check"}
  checkBadge.classList.toggle("hidden",!game.isCheck());
}

function findKing(color){
  for(const f of files)for(let r=1;r<=8;r++){const s=f+r,p=game.get(s);if(p?.type==="k"&&p.color===color)return s}
  return null;
}

function tap(sq){
  if(busy||pendingPromotion)return;
  const piece=game.get(sq);
  if(!selected){if(piece&&piece.color===game.turn()){selected=sq;render()}return}
  if(sq===selected){selected=null;render();return}
  const move=game.moves({square:selected,verbose:true}).find(m=>m.to===sq);
  if(!move){if(piece&&piece.color===game.turn()){selected=sq;render()}return}
  if(move.promotion){pendingPromotion={from:selected,to:sq};modal.classList.remove("hidden");return}
  play(selected,sq);
}

async function play(from,to,promotion){
  busy=true;
  const moving=game.get(from);
  const captured=game.get(to);
  selected=null;
  render();
  if(moving?.type==="n") await animateKnight(from,to,!!captured,moving.color);
  else await wait(captured?150:90);
  game.move({from,to,...(promotion?{promotion}: {})});
  busy=false;
  render();
}

const wait=ms=>new Promise(r=>setTimeout(r,ms));

function center(sq){
  const r=elFor(sq).getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2,size:r.width};
}

async function loadHorse(){
  const response=await fetch("horse.svg",{cache:"no-store"});
  if(!response.ok)throw new Error("horse.svg could not be loaded");
  return response.text();
}

function animatePart(el,keyframes,options){
  if(!el)return null;
  return el.animate(keyframes,{fill:"both",...options});
}

async function animateKnight(from,to,isCapture,color){
  const A=center(from), B=center(to);
  const size=Math.min(A.size*1.72,138);
  const wrap=document.createElement("div");
  wrap.className="knight-animation";
  wrap.style.width=`${size}px`;
  wrap.style.height=`${size}px`;
  wrap.style.left=`${A.x-size/2}px`;
  wrap.style.top=`${A.y-size*.88}px`;
  if(color==="b")wrap.style.filter="brightness(.36) saturate(.48) drop-shadow(0 13px 10px rgba(0,0,0,.48))";
  animationLayer.appendChild(wrap);

  const svgText=await loadHorse();
  wrap.innerHTML=svgText;
  const svg=wrap.querySelector("svg");
  svg.setAttribute("width","100%");svg.setAttribute("height","100%");
  const parts={
    body:svg.querySelector("#body"),
    neck:svg.querySelector("#neck"),
    head:svg.querySelector("#head"),
    mane:svg.querySelector("#mane"),
    tail:svg.querySelector("#tail"),
    frontA:svg.querySelector("#front-leg-a"),
    frontB:svg.querySelector("#front-leg-b"),
    rearA:svg.querySelector("#rear-leg-a"),
    rearB:svg.querySelector("#rear-leg-b"),
    shadow:svg.querySelector("#shadow")
  };

  // Start as a compressed "statue awakening".
  wrap.animate([
    {transform:"translate3d(0,18px,0) scale(.72,.78)"},
    {transform:"translate3d(0,0,0) scale(1,1)"}
  ],{duration:230,easing:"cubic-bezier(.2,.9,.25,1)",fill:"forwards"});

  animatePart(parts.neck,[
    {transform:"rotate(0deg) translateY(8px)"},{transform:"rotate(-5deg) translateY(-2px)"},{transform:"rotate(0deg)"}
  ],{duration:260,easing:"ease-out"});
  animatePart(parts.head,[
    {transform:"rotate(0deg)"},{transform:"rotate(-3deg) translateY(-4px)"},{transform:"rotate(1deg)"},{transform:"rotate(0deg)"}
  ],{duration:330,easing:"ease-out"});
  animatePart(parts.mane,[
    {transform:"rotate(0deg)"},{transform:"rotate(-7deg) translateX(-2px)"},{transform:"rotate(4deg) translateX(3px)"},{transform:"rotate(0deg)"}
  ],{duration:470,easing:"ease-in-out"});
  animatePart(parts.tail,[
    {transform:"rotate(0deg)"},{transform:"rotate(10deg)"},{transform:"rotate(-7deg)"},{transform:"rotate(0deg)"}
  ],{duration:480,easing:"ease-in-out"});

  await wait(230);

  // Reveal full anatomy and make the leap. The four legs articulate independently.
  const dx=B.x-A.x, dy=B.y-A.y;
  const jumpHeight=Math.max(36,A.size*.78);
  const duration=isCapture?980:880;

  const move=wrap.animate([
    {transform:"translate3d(0,0,0) scale(1) rotate(0deg)",offset:0},
    {transform:`translate3d(${dx*.18}px,${dy*.18-jumpHeight*.52}px,0) scale(1.04) rotate(-2deg)`,offset:.25},
    {transform:`translate3d(${dx*.55}px,${dy*.55-jumpHeight}px,0) scale(1.08) rotate(2deg)`,offset:.52},
    {transform:`translate3d(${dx*.84}px,${dy*.84-jumpHeight*.25}px,0) scale(1.03) rotate(-1deg)`,offset:.78},
    {transform:`translate3d(${dx}px,${dy}px,0) scale(.98) rotate(0deg)`,offset:1}
  ],{duration,easing:"cubic-bezier(.18,.72,.2,1)",fill:"forwards"});

  animatePart(parts.rearA,[
    {transform:"rotate(0deg) translateY(0)"},{transform:"rotate(-25deg) translateY(4px)",offset:.18},
    {transform:"rotate(28deg) translateY(-5px)",offset:.52},{transform:"rotate(8deg)",offset:.78},{transform:"rotate(0deg)"}
  ],{duration,easing:"cubic-bezier(.2,.7,.2,1)"});
  animatePart(parts.rearB,[
    {transform:"rotate(0deg)"},{transform:"rotate(18deg)",offset:.22},
    {transform:"rotate(-30deg)",offset:.54},{transform:"rotate(10deg)",offset:.8},{transform:"rotate(0deg)"}
  ],{duration,easing:"cubic-bezier(.2,.7,.2,1)"});
  animatePart(parts.frontA,[
    {transform:"rotate(0deg)"},{transform:"rotate(20deg)",offset:.25},
    {transform:"rotate(-28deg)",offset:.56},{transform:"rotate(18deg)",offset:.82},{transform:"rotate(0deg)"}
  ],{duration,easing:"cubic-bezier(.2,.7,.2,1)"});
  animatePart(parts.frontB,[
    {transform:"rotate(0deg)"},{transform:"rotate(-18deg)",offset:.23},
    {transform:"rotate(30deg)",offset:.57},{transform:"rotate(-16deg)",offset:.83},{transform:"rotate(0deg)"}
  ],{duration,easing:"cubic-bezier(.2,.7,.2,1)"});
  animatePart(parts.mane,[
    {transform:"rotate(0deg)"},{transform:"rotate(-12deg) translateX(-2px)",offset:.28},
    {transform:"rotate(8deg) translateX(4px)",offset:.58},{transform:"rotate(-5deg)",offset:.82},{transform:"rotate(0deg)"}
  ],{duration,easing:"ease-in-out"});
  animatePart(parts.tail,[
    {transform:"rotate(0deg)"},{transform:"rotate(14deg)",offset:.25},
    {transform:"rotate(-12deg)",offset:.58},{transform:"rotate(8deg)",offset:.82},{transform:"rotate(0deg)"}
  ],{duration,easing:"ease-in-out"});

  await move.finished.catch(()=>{});
  await wait(70);

  // Landing compression and return to the normal statue.
  wrap.animate([
    {transform:`translate3d(${dx}px,${dy}px,0) scale(1,.94)`},
    {transform:`translate3d(${dx}px,${dy}px,0) scale(.96,1.04)`},
    {transform:`translate3d(${dx}px,${dy}px,0) scale(1,1)`}
  ],{duration:220,easing:"cubic-bezier(.2,.8,.2,1)",fill:"forwards"});

  await wait(220);
  wrap.animate([
    {opacity:1,transform:`translate3d(${dx}px,${dy}px,0) scale(1)`},
    {opacity:0,transform:`translate3d(${dx}px,${dy}px,0) scale(.88,.9)`}
  ],{duration:180,easing:"ease-in",fill:"forwards"});
  await wait(190);
  wrap.remove();
}

document.querySelectorAll(".promotion-grid button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const p=pendingPromotion;pendingPromotion=null;modal.classList.add("hidden");
    if(p)play(p.from,p.to,btn.dataset.piece);
  });
});
document.querySelector("#resetBtn").addEventListener("click",()=>{if(!busy){game.reset();selected=null;render()}});
document.querySelector("#undoBtn").addEventListener("click",()=>{if(!busy){game.undo();selected=null;render()}});
document.querySelector("#flipBtn").addEventListener("click",()=>{if(!busy){orientation=orientation==="w"?"b":"w";render()}});

render();
