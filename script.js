
class WebcamFeed {
  constructor(canvas) {
    this.canvas = canvas;
  }
}


const numberOfBlocks = 1100;
const edgeThreshold = 20;

const edgeColours = [
  [0, 0, 255],
  [0, 0, 255],
  [255, 0, 0],
  [255, 0, 0],
  [0, 255, 0],
  [0, 255, 0],
  [255, 0, 255],
  [255, 0, 255],
  [0, 0, 0]
];

const loaded = function () {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  const video = document.createElement('video');
  const width = canvas.width;
  const height = canvas.height;
  const blockSize = Math.max(Math.floor(Math.sqrt(width * height / numberOfBlocks) / 2) * 2, 2);
  const sectionSize = blockSize / 2;
  const blockSectionPixelCount = Math.floor(blockSize * blockSize / 4);
	const xmax = width - blockSize;
  const ymax = height - blockSize;
  const subImageWidth = (width / 4) | 0;
  const subImageHeight = (height / 4) | 0;
  const pauseButton = document.getElementById('pauseButton');
  let animationHandle;

  pauseButton.onclick = function () {
    if (video.paused) {
      video.play();
      pauseButton.innerText = 'pause';
    } else {
      video.pause();
      pauseButton.innerText = 'play';
    }
  };

  const successCallback = function (stream) {
    video.src = URL.createObjectURL(stream);
    animationHandle = requestAnimationFrame(loop);
    video.onpause = () => cancelAnimationFrame(animationHandle);
    video.play();
  };

  const loop = function () {
    context.drawImage(video, 0, 0, width, height);
    toGrey();
    animationHandle = requestAnimationFrame(loop);
  };

  const errorCallback = function (error) {
    console.error(error);
  };

  const toGrey = function () {
    const frame = context.getImageData(0, 0, width, height);
    
    for (let i = 0; i < frame.data.length; i += 4) {
      let grey = Math.floor(
          0.2126 * frame.data[i]
        + 0.7152 * frame.data[i + 1]
        + 0.0722 * frame.data[i + 2]
      );

      frame.data[i] = grey;
      frame.data[i + 1] = grey;
      frame.data[i + 2] = grey;
    }

    for (let y = 0; y < ymax; y += blockSize) {
      for (let x = 0; x < xmax; x += blockSize) {
        colourBlock(frame, x, y);
      }
    }

    context.putImageData(frame, 0, 0);
  };

  const colourBlock = function (frame, startX, startY) {
    let block = [0, 0, 0, 0];

    for (let y = 0; y < blockSize; y++) {
      for (let x = 0; x < blockSize; x++) {
        let b = Math.floor(y / sectionSize) * 2 + Math.floor(x / sectionSize);
        block[b] += frame.data[(startX + x + (startY + y) * width) * 4];
      }
    }

    for (let i = 0; i < block.length; i++) {
      block[i] /= blockSectionPixelCount;
    }

    let edges = [
      // vertical white left [0]
      block[0] + block[2] - (block[1] + block[3]),
      // vertical white right [1]
      block[1] + block[3] - (block[0] + block[2]),
      // horizontal white top [2]
      block[0] + block[1] - (block[2] + block[3]),
      // horizontal white bottom [3]
      block[2] + block[3] - (block[0] + block[1]),
      // 45 degree diagonal white top left [4]
      Math.sqrt(2) * (block[0] - block[3]),
      // 45 degree diagonal white bottom right [5]
      Math.sqrt(2) * (block[3] - block[0]),
      // 135 degree diagonal white top right [6]
      Math.sqrt(2) * (block[1] - block[2]),
      // 135 degree diagonal white bottom left [7]
      Math.sqrt(2) * (block[2] - block[1]),
      // non-directional [8]
      Math.abs(2 * (block[0] - block[1] - block[2] + block[3]))
    ];

		let max = edgeThreshold;
		let edge = -1;

		// find the max valued edge (if there are none greater than edgeThreshold, edge will remain -1)
		for (let i = 0; i < edges.length; i++) {
			if (edges[i] > max) {
				edge = i;
				max = edges[i];
			}
		}

    switch (edge) {
      case 0:
        block[0] = block[2] = 1;
        block[1] = block[3] = 0;
        break;
      case 1:
        block[0] = block[2] = 0;
        block[0] = block[3] = 1;
        break;
      case 2:
        block[0] = block[1] = 1;
        block[2] = block[3] = 0;
        break;
      case 3:
        block[0] = block[1] = 0;
        block[2] = block[3] = 1;
        break;
      case 4:
        block[0] = 1;
        block[1] = block[2] = 0.5;
        block[3] = 0;
        break;
      case 5:
        block[3] = 1;
        block[1] = block[2] = 0.5;
        block[1] = 0;
        break;
      case 6:
        block[1] = 1;
        block[0] = block[3] = 0.5;
        block[2] = 0;
        break;
      case 7:
        block[2] = 1;
        block[0] = block[3] = 0.5;
        block[1] = 0;
        break;
    }

    if (edge > -1 && edge < 8) {
      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          let b = Math.floor(y / sectionSize) * 2 + Math.floor(x / sectionSize);
          let i = (startX + x + (startY + y) * width) * 4;
          let colour = edgeColours[edge];
          frame.data[i] = colour[0] * block[b];
          frame.data[i + 1] = colour[1] * block[b];
          frame.data[i + 2] = colour[2] * block[b];
        }
      }
    }
  };


  navigator.getUserMedia({video: true}, successCallback, errorCallback);
};


document.addEventListener('DOMContentLoaded', loaded, false);
