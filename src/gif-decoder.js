import { parseGIF, decompressFrames } from 'gifuct-js';

/**
 * Decode a GIF ArrayBuffer into frames with metadata.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{ frames: Array, width: number, height: number }}
 */
export function decodeGif(arrayBuffer) {
  const gif = parseGIF(arrayBuffer);
  const frames = decompressFrames(gif, true);
  return {
    frames,
    width: gif.lsd.width,
    height: gif.lsd.height,
  };
}
