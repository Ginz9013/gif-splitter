# GIF Splitter

A browser-based tool for splitting animated GIFs into grid cells while preserving animation.

## Features

- Split animated GIFs into customizable grid (1-10 rows/columns)
- Preview with grid overlay before splitting
- Web Worker parallel encoding for smooth UI
- Download individual cells or all at once as ZIP
- Drag & drop or click to upload
- Correctly handles GIF disposal methods and transparency

## Tech Stack

- **Vite** — Build tool
- **gifuct-js** — GIF decoding
- **gifenc** — GIF encoding (Web Worker)
- **JSZip + FileSaver.js** — ZIP packaging & download

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## How It Works

1. **Decode** — Parse GIF into frame patches using gifuct-js
2. **Composite** — Assemble patches into full RGBA frames, handling disposal methods (0-3)
3. **Split** — Slice each frame into grid cells via Canvas `getImageData`
4. **Encode** — Re-encode each cell's frames into animated GIFs using gifenc in Web Workers
5. **Download** — Preview results and download individually or as ZIP
