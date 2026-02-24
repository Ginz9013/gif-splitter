/**
 * Split composited full frames into a grid of cells.
 *
 * @param {Array<{ imageData: ImageData, delay: number }>} fullFrames
 * @param {number} gifWidth
 * @param {number} gifHeight
 * @param {number} rows
 * @param {number} cols
 * @returns {{ grid: Array<Array<Array<{ rgba: Uint8ClampedArray, delay: number, width: number, height: number }>>>, cellWidth: number, cellHeight: number }}
 */
export function splitFramesIntoGrid(fullFrames, gifWidth, gifHeight, rows, cols) {
  const cellWidth = Math.floor(gifWidth / cols);
  const cellHeight = Math.floor(gifHeight / rows);

  // grid[row][col] = array of frame data for that cell
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [])
  );

  const canvas = new OffscreenCanvas(gifWidth, gifHeight);
  const ctx = canvas.getContext('2d');

  for (const { imageData, delay } of fullFrames) {
    ctx.putImageData(imageData, 0, 0);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellWidth;
        const y = r * cellHeight;
        // Last row/column absorbs remainder pixels
        const w = c === cols - 1 ? gifWidth - x : cellWidth;
        const h = r === rows - 1 ? gifHeight - y : cellHeight;
        const cellData = ctx.getImageData(x, y, w, h);
        grid[r][c].push({ rgba: cellData.data, delay, width: w, height: h });
      }
    }
  }

  return { grid, cellWidth, cellHeight };
}
