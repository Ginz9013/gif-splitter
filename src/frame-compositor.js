/**
 * Composite GIF frame patches into full RGBA frames,
 * correctly handling GIF disposal methods (0-3).
 *
 * @param {Array} frames - Decoded frames from gifuct-js
 * @param {number} width - GIF logical screen width
 * @param {number} height - GIF logical screen height
 * @returns {Array<{ imageData: ImageData, delay: number }>}
 */
export function compositeFrames(frames, width, height) {
  const currentCanvas = new OffscreenCanvas(width, height);
  const currentCtx = currentCanvas.getContext('2d');
  const previousCanvas = new OffscreenCanvas(width, height);
  const previousCtx = previousCanvas.getContext('2d');

  const fullFrames = [];

  for (const frame of frames) {
    const { dims, patch, disposalType } = frame;
    // Normalize delay: 0 means "as fast as possible", browsers treat as ~100ms
    const delay = frame.delay <= 0 ? 10 : frame.delay;

    // Save state before drawing for disposal method 3 (restore to previous)
    if (disposalType === 3) {
      previousCtx.clearRect(0, 0, width, height);
      previousCtx.drawImage(currentCanvas, 0, 0);
    }

    // Draw the patch onto the current canvas
    const patchData = new Uint8ClampedArray(patch);
    const imageData = new ImageData(patchData, dims.width, dims.height);
    currentCtx.putImageData(imageData, dims.left, dims.top);

    // Capture the full composited frame
    const fullImageData = currentCtx.getImageData(0, 0, width, height);
    fullFrames.push({ imageData: fullImageData, delay });

    // Apply disposal method AFTER capturing
    switch (disposalType) {
      case 2: // Restore to background (clear the patch area)
        currentCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
        break;
      case 3: // Restore to previous
        currentCtx.clearRect(0, 0, width, height);
        currentCtx.drawImage(previousCanvas, 0, 0);
        break;
      // case 0, 1: do nothing (leave as is)
    }
  }

  return fullFrames;
}
