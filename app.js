import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

const game = new Chess();
const board = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const checkBadge = document.querySelector("#checkBadge");
const modal = document.querySelector("#promotionModal");
let selected = null, busy = false, pendingPromotion = null, orientation = "w";

const files = ["a","b","c","d","e","f","g","h"];
const glyph = {
  p:["♙","♟"], n:["♘","♞"], b:["♗","♝"],
  r:["♖","♜"], q:["♕","♛"], k:["♔","♚"]
};

function sqAt(col,row){
  const f = orientation === "w" ? col : 7-col;
  const r = orientation === "w" ? 7-row : row;
  return files[f] + (8-r);
}

function elFor(sq){ return document.querySelector(`[data-square="${sq}"]`); }

function render(){
  board.innerHTML = "";
  const checkedKing = game.isCheck() ? findKing(game.turn()) : null;

  for(let row=0; row<8; row++){
    for(let col=0; col<8; col++){
      const sq = sqAt(col,row);
      const b = document.createElement("button");
      b.className = `square ${((row+col)%2===0)?"light":"dark"}`;
      b.dataset.square = sq;
      b.addEventListener("click",()=>tap(sq));

      if(selected === sq) b.classList.add("selected");
      if(checkedKing === sq) b.classList.add("in-check");

      const piece = game.get(sq);
      if(piece){
        const p = document.createElement("span");
        p.className = `piece ${piece.color==="w"?"white-piece":"black-piece"}`;

        if(piece.type === "n" && ((piece.color==="w" && sq==="g1") || (piece.color==="b" && sq==="b8"))){
          const img = document.createElement("img");
          img.className = "knight-piece";
          img.src = "knight.svg";
          img.alt = piece.color==="w" ? "White Knight" : "Black Knight";
          if(piece.color==="b") img.style.filter="brightness(.34) saturate(.45)";
          p.appendChild(img);
        } else {
          p.textContent = glyph[piece.type][piece.color==="w"?0:1];
        }
        b.appendChild(p);
      }

      if(selected){
        const move = game.moves({square:selected, verbose:true}).find(m=>m.to===sq);
        if(move){
          b.classList.add("legal");
          if(move.captured) b.classList.add("capture");
        }
      }
      board.appendChild(b);
    }
  }

  if(game.isCheckmate()){
    statusEl.textContent = `${game.turn()==="w"?"Black":"White"} wins — checkmate`;
  } else if(game.isStalemate()) {
    statusEl.textContent = "Draw — stalemate";
  } else if(game.isDraw()) {
    statusEl.textContent = "Draw";
  } else {
    statusEl.textContent = game.turn()==="w" ? "White to move" : "Black to move";
    if(game.isCheck()) statusEl.textContent += " — check";
  }
  checkBadge.classList.toggle("hidden", !game.isCheck());
}

function findKing(color){
  for(const f of files) for(let r=1;r<=8;r++){
    const s=f+r, p=game.get(s);
    if(p?.type==="k" && p.color===color) return s;
  }
  return null;
}

function tap(sq){
  if(busy || pendingPromotion) return;
  const piece = game.get(sq);

  if(!selected){
    if(piece && piece.color===game.turn()){ selected=sq; render(); }
    return;
  }

  if(sq===selected){ selected=null; render(); return; }

  const move = game.moves({square:selected, verbose:true}).find(m=>m.to===sq);
  if(!move){
    if(piece && piece.color===game.turn()){ selected=sq; render(); }
    return;
  }

  if(move.promotion){
    pendingPromotion={from:selected,to:sq};
    modal.classList.remove("hidden");
    return;
  }
  play(selected,sq);
}

async function play(from,to,promotion){
  busy=true;
  const moving=game.get(from);
  const captured=game.get(to);
  selected=null;

  if(moving?.type==="n") await animateKnight(from,to,!!captured);
  else await wait(captured?150:90);

  game.move({from,to,...(promotion?{promotion}: {})});
  busy=false;
  render();
}

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

function center(sq){
  const r=elFor(sq).getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2,size:r.width};
}

function animateKnight(from,to,isCapture){
  return new Promise(resolve=>{
    const a=document.createElement("div");
    a.id="animator";
    const img=document.createElement("img");
    img.src="horse.svg"; img.alt="";
    a.appendChild(img); document.body.appendChild(a);

    const A=center(from), B=center(to);
    const size=Math.min(A.size*2,190);
    a.style.setProperty("--size",`${size}px`);
    a.style.setProperty("--x",`${A.x-size/2}px`);
    a.style.setProperty("--y",`${A.y-size*.68}px`);

    const origin=elFor(from)?.querySelector(".piece");
    if(origin) origin.classList.add("fading");

    requestAnimationFrame(()=>{
      a.classList.add("active");
      const dx=B.x-A.x, dy=B.y-A.y, duration=isCapture?760:640;
      a.animate([
        {transform:"translate(0,0) scale(.72) rotate(-2deg)"},
        {transform:`translate(${dx*.38}px,${dy*.38-size*.55}px) scale(1.03) rotate(3deg)`,offset:.42},
        {transform:`translate(${dx*.75}px,${dy*.75-size*.12}px) scale(1) rotate(-1deg)`,offset:.76},
        {transform:`translate(${dx}px,${dy}px) scale(.93)`}
      ],{duration,easing:"cubic-bezier(.18,.76,.22,1)",fill:"forwards"});
      setTimeout(()=>{a.style.opacity="0";setTimeout(()=>{a.remove();resolve()},120)},duration+10);
    });
  });
}

document.querySelectorAll(".promotion-grid button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const p=pendingPromotion; pendingPromotion=null; modal.classList.add("hidden");
    if(p) play(p.from,p.to,btn.dataset.piece);
  });
});

document.querySelector("#resetBtn").addEventListener("click",()=>{
  if(!busy){game.reset();selected=null;render();}
});
document.querySelector("#undoBtn").addEventListener("click",()=>{
  if(!busy){game.undo();selected=null;render();}
});
document.querySelector("#flipBtn").addEventListener("click",()=>{
  if(!busy){orientation=orientation==="w"?"b":"w";render();}
});

render();
