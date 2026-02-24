import { decodeGif } from './gif-decoder.js';
import { compositeFrames } from './frame-compositor.js';
import { splitFramesIntoGrid } from './frame-splitter.js';
import { encodeAllCells } from './gif-encoder.js';
import { downloadSingleGif, downloadAllAsZip } from './download-manager.js';

// DOM elements
const colsSelect = document.getElementById('cols');
const rowsSelect = document.getElementById('rows');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImg = document.getElementById('previewImg');
const gridOverlay = document.getElementById('gridOverlay');
const splitBtn = document.getElementById('splitBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const resultsGrid = document.getElementById('resultsGrid');
const downloadAllBtn = document.getElementById('downloadAllBtn');

let currentFile = null;
let currentArrayBuffer = null;
let currentResults = null;
let blobUrls = [];

// --- Upload handling ---

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'image/gif') {
    handleFile(file);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) {
    handleFile(fileInput.files[0]);
  }
});

async function handleFile(file) {
  currentFile = file;
  currentArrayBuffer = await file.arrayBuffer();

  // Show preview
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewSection.hidden = false;
  resultsSection.hidden = true;
  progressSection.hidden = true;

  // Update upload area
  uploadArea.classList.add('has-file');
  uploadArea.querySelector('.upload-content p').textContent = file.name;

  updateGridOverlay();
}

// --- Grid overlay ---

function updateGridOverlay() {
  const cols = parseInt(colsSelect.value);
  const rows = parseInt(rowsSelect.value);

  gridOverlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridOverlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  gridOverlay.innerHTML = '';

  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    gridOverlay.appendChild(cell);
  }
}

colsSelect.addEventListener('change', updateGridOverlay);
rowsSelect.addEventListener('change', updateGridOverlay);

// --- Split ---

splitBtn.addEventListener('click', async () => {
  if (!currentArrayBuffer) return;

  const cols = parseInt(colsSelect.value);
  const rows = parseInt(rowsSelect.value);

  splitBtn.disabled = true;
  progressSection.hidden = false;
  resultsSection.hidden = true;
  cleanupBlobUrls();

  try {
    // Phase 1: Decode
    setProgress(0, 'Decoding GIF...');
    // Use setTimeout to let the UI update
    await tick();
    const { frames, width, height } = decodeGif(currentArrayBuffer);

    // Phase 2: Composite
    setProgress(20, `Compositing ${frames.length} frames...`);
    await tick();
    const fullFrames = compositeFrames(frames, width, height);

    // Phase 3: Split
    setProgress(40, 'Splitting frames into grid...');
    await tick();
    const { grid } = splitFramesIntoGrid(fullFrames, width, height, rows, cols);

    // Phase 4: Encode
    setProgress(50, 'Encoding split GIFs...');
    await tick();
    currentResults = await encodeAllCells(grid, (completed, total) => {
      const pct = 50 + Math.round((completed / total) * 50);
      setProgress(pct, `Encoding: ${completed}/${total}`);
    });

    setProgress(100, 'Done!');
    showResults(currentResults, rows, cols);
  } catch (err) {
    console.error('Split failed:', err);
    setProgress(0, `Error: ${err.message}`);
  } finally {
    splitBtn.disabled = false;
  }
});

function setProgress(pct, text) {
  progressFill.style.width = `${pct}%`;
  progressText.textContent = text;
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// --- Results ---

function showResults(results, rows, cols) {
  resultsGrid.innerHTML = '';
  resultsGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  resultsSection.hidden = false;

  const baseName = currentFile
    ? currentFile.name.replace(/\.gif$/i, '')
    : 'split';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const gifBytes = results[r][c];
      const blob = new Blob([gifBytes], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      blobUrls.push(url);

      const cell = document.createElement('div');
      cell.className = 'result-cell';

      const img = document.createElement('img');
      img.src = url;
      img.alt = `Row ${r + 1}, Col ${c + 1}`;

      const label = document.createElement('span');
      label.className = 'cell-label';
      label.textContent = `R${r + 1} C${c + 1}`;

      const dlBtn = document.createElement('button');
      dlBtn.className = 'btn-cell-download';
      dlBtn.textContent = 'Download';
      const filename = `${baseName}_r${r + 1}_c${c + 1}.gif`;
      dlBtn.addEventListener('click', () => downloadSingleGif(gifBytes, filename));

      cell.appendChild(img);
      cell.appendChild(label);
      cell.appendChild(dlBtn);
      resultsGrid.appendChild(cell);
    }
  }
}

function cleanupBlobUrls() {
  for (const url of blobUrls) {
    URL.revokeObjectURL(url);
  }
  blobUrls = [];
}

// --- Download all ---

downloadAllBtn.addEventListener('click', () => {
  if (!currentResults) return;
  const baseName = currentFile
    ? currentFile.name.replace(/\.gif$/i, '')
    : 'split';
  downloadAllAsZip(currentResults, baseName);
});
