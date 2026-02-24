import EncodeWorker from './encode-worker.js?worker';

/**
 * Encode a single grid cell's frames into an animated GIF using a Web Worker.
 */
function encodeGridCellGif(cellFrames, width, height) {
  return new Promise((resolve, reject) => {
    const worker = new EncodeWorker();

    const framesData = cellFrames.map((f) => ({
      rgba: f.rgba,
      delay: f.delay,
      width: f.width || width,
      height: f.height || height,
    }));

    // Transfer the RGBA buffers to avoid copying
    const transferables = framesData
      .map((f) => f.rgba.buffer)
      .filter((buf, i, arr) => arr.indexOf(buf) === i); // deduplicate

    worker.postMessage({ frames: framesData, width, height }, transferables);

    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
  });
}

/**
 * Encode all grid cells into animated GIFs with progress callback.
 *
 * @param {Array<Array<Array>>} grid - grid[row][col] = frame data array
 * @param {Function} onProgress - callback(completed, total)
 * @returns {Promise<Array<Array<Uint8Array>>>} resultsGrid[row][col] = GIF bytes
 */
export async function encodeAllCells(grid, onProgress) {
  const rows = grid.length;
  const cols = grid[0].length;
  const total = rows * cols;
  let completed = 0;

  const results = Array.from({ length: rows }, () => new Array(cols));

  const maxConcurrent = Math.min(navigator.hardwareConcurrency || 4, 4);
  const tasks = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tasks.push({ r, c, frames: grid[r][c] });
    }
  }

  // Process in batches
  for (let i = 0; i < tasks.length; i += maxConcurrent) {
    const batch = tasks.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(({ r, c, frames }) =>
        encodeGridCellGif(frames, frames[0].width, frames[0].height).then(
          (gifBytes) => {
            completed++;
            onProgress?.(completed, total);
            return { r, c, gifBytes };
          }
        )
      )
    );

    for (const { r, c, gifBytes } of batchResults) {
      results[r][c] = gifBytes;
    }
  }

  return results;
}
