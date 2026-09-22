# Animated Chess — V0.3 Knight Animation Prototype

Mobile-first browser chess prototype.

## V0.3 focus
The chess engine remains based on chess.js. The Knight animation has been rebuilt as an event-driven sequence:

1. Awaken
2. Reveal the living four-legged form
3. Leap on an arc
4. Animate the four legs independently
5. Land with compression
6. Fade back to the normal static Knight

The horse SVG is split into named animation parts so future movement, capture, check and special-event animations can reuse the same animation controller.

## Files
- `index.html` — UI
- `style.css` — visual styling
- `app.js` — chess logic + animation controller
- `knight.svg` — static Knight
- `horse.svg` — animation-ready four-legged Knight form

## Deploy
Upload/replace these files in the GitHub repository root. GitHub Pages should serve `index.html`.
