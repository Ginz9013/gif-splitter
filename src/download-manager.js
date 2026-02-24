import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Download a single GIF cell.
 */
export function downloadSingleGif(gifBytes, filename) {
  const blob = new Blob([gifBytes], { type: 'image/gif' });
  saveAs(blob, filename);
}

/**
 * Download all split GIFs as a ZIP file.
 *
 * @param {Array<Array<Uint8Array>>} resultsGrid
 * @param {string} baseName
 */
export async function downloadAllAsZip(resultsGrid, baseName = 'split') {
  const zip = new JSZip();

  for (let r = 0; r < resultsGrid.length; r++) {
    for (let c = 0; c < resultsGrid[r].length; c++) {
      const filename = `${baseName}_row${r + 1}_col${c + 1}.gif`;
      zip.file(filename, resultsGrid[r][c]);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${baseName}.zip`);
}
