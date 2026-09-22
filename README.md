# Animated Chess — V0.2 Knight Engine Prototype

V0.2 replaces the temporary Knight-only movement logic with **chess.js**.

Included:
- Correct standard starting position
- Legal move generation
- Turn enforcement
- Captures
- Check/checkmate/stalemate/draw detection
- Castling and en passant handled by chess.js
- Promotion chooser
- Undo
- Board flip
- Knight transformation into a full four-legged horse during movement
- Mobile-first UI

The app loads chess.js from jsDelivr, so the browser needs internet access on first load.

Next target: V0.3 — reusable animation/event architecture, capture reactions, check reactions, castling sequence, promotion transformation, and refined SVG assets.
