import * as getPixels from 'get-pixels';
import EdgeDetector from './edge-detector';


const loadImage = (path: string, type?: string) => {
  return new Promise<any>((resolve, reject) => {
    getPixels(path, type, (err, pixels) => {
      if (err) reject(err);
      else resolve(pixels);
    })
  });
};


const run = async () => {
  let image = await loadImage(process.argv[2]);
  let [width, height, channels] = image.shape;
  let extractor = new EdgeDetector(width, height, 900, 20, channels);
  console.log(extractor.getDescriptor(image.data).toString());
};

run().catch(console.error);
