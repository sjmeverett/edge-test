import Webcam from './webcam';
import EdgeDetector from './edge-detector';
import BoxDetector from './box-detector';
import { cat1, cat2 } from './cats';
import { getSedDistance } from './sed';

const loaded = () => {
  const canvas = <HTMLCanvasElement>document.getElementById('canvas');
  const canvasContext = canvas.getContext('2d');
  const result = <HTMLCanvasElement>document.getElementById('result');
  const resultContext = result.getContext('2d');
  const webcam = new Webcam(canvas);
  webcam.play();

  const pauseButton = document.getElementById('pauseButton');

  pauseButton.onclick = () => {
    if (webcam.isPlaying()) {
      webcam.pause();
      pauseButton.innerText = 'play';

    } else {
      webcam.play();
      pauseButton.innerText = 'pause';
    }
  };

  const edgeDetector = new EdgeDetector(canvas.width, canvas.height, 900, 20);
  const edgeHistogram = new EdgeDetector(result.width, result.height, 900, 20);
  const boxDetector = new BoxDetector();

  webcam.on('render', (context) => {
    let edges = edgeDetector.getEdges(canvasContext.getImageData(0, 0, canvas.width, canvas.height).data);
    let boxes = boxDetector.getBoxes(edges);
    context.strokeStyle = 'rgba(255,0,0,0.5)';
    context.lineWidth = 3;

    let box = boxes[0];

    if (box) {
      let bound = getBoundingBox(box);
      //context.strokeRect(bound.x, bound.y, bound.width, bound.height);
      resultContext.drawImage(canvas, bound.x, bound.y, bound.width, bound.height, 0, 0, result.width, result.height);

      let descriptor = edgeHistogram.getDescriptor(resultContext.getImageData(0, 0, result.width, result.height).data);

      console.log({
        cat1: getSedDistance(descriptor, cat1),
        cat2: getSedDistance(descriptor, cat2)
      })
    }
  });
};

const getBoundingBox = (box) => {
  const x1 = Math.min(box[0].x, box[3].x);
  const y1 = Math.min(box[0].y, box[1].y);
  const x2 = Math.max(box[1].x, box[2].x);
  const y2 = Math.max(box[2].y, box[3].y);
  const width = x2 - x1;
  const height = y2 - y1;

  return {
    x: x1,
    y: y1,
    width,
    height
  };
}

document.addEventListener('DOMContentLoaded', loaded, false);
