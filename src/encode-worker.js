import { GIFEncoder, quantize, applyPalette } from 'gifenc';

self.addEventListener('message', (ev) => {
  const { frames, width, height } = ev.data;

  const gif = GIFEncoder();

  for (let i = 0; i < frames.length; i++) {
    const { rgba, delay, width: fw, height: fh } = frames[i];
    const palette = quantize(rgba, 256, { format: 'rgb444' });
    const index = applyPalette(rgba, palette, 'rgb444');

    gif.writeFrame(index, fw || width, fh || height, {
      palette,
      delay,
      repeat: 0,
    });
  }

  gif.finish();
  const output = gif.bytesView();
  const result = new Uint8Array(output);
  self.postMessage(result, [result.buffer]);
});
