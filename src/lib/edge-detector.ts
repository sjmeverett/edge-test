
export interface Edge {
  edge: number;
  a?: {x: number, y: number};
  b?: {x: number, y: number};
  visited?: boolean;
};


export default class EdgeDetector {
  private blockSize: number;
  private sectionSize: number;
  private blockSectionPixelCount: number;
  private xmax: number;
  private ymax: number;
  private subImageWidth: number;
  private subImageHeight: number;

  constructor(private width: number, private height: number, private numberOfBlocks = 1100, private edgeThreshold = 11, private channels = 4) {
    this.blockSize = Math.max(
      Math.floor(Math.sqrt(this.width * this.height / this.numberOfBlocks) / 2) * 2,
      2
    );

    this.sectionSize = this.blockSize / 2;
    this.blockSectionPixelCount = Math.floor(this.blockSize * this.blockSize / 4);
    this.xmax = this.width - this.blockSize;
    this.ymax = this.height - this.blockSize;

    this.subImageWidth = this.width / 4;
    this.subImageHeight = this.height / 4;
  }


  public getEdges(image: Uint8ClampedArray): Edge[] {
    let data = this.toGreyscale(image);
    let edges: Edge[] = [];

    for (let y = 0; y < this.ymax; y += this.blockSize) {
      for (let x = 0; x < this.xmax; x += this.blockSize) {
        let edge = this.getEdge(data, x, y);

        if (edge) {
          edges.push(edge);
        }
      }
    }

    return edges;
  }


  public getDescriptor(image: Uint8ClampedArray): Float32Array {
    let data = this.toGreyscale(image);
    const histogram = new Uint32Array(80);
    const blockCounts = new Uint32Array(16);

    for (let y = 0; y < this.ymax; y += this.blockSize) {
      for (let x = 0; x < this.xmax; x += this.blockSize) {
        let edgeType = this.getEdgeType(data, x, y);
        let subImage = Math.floor(y / this.subImageHeight) * 4 + Math.floor(x / this.subImageWidth);

        if (edgeType != null) {
					histogram[subImage * 5 + edgeType]++;
        }

        blockCounts[subImage]++;
      }
    }

    let index = 0;
    let normalised = new Float32Array(80);

    for (let i = 0; i < 16; i++) {
			for (let j = 0; j < 5; j++) {
				normalised[index] = histogram[index] / blockCounts[i];
				index++;
			}
		}

    return normalised;
  }


  private toGreyscale(data: Uint8ClampedArray): Uint8ClampedArray {
    let greyData = new Uint8ClampedArray(data.length / this.channels);
    let index = 0;

    for (let i = 0; i < data.length; i += this.channels) {
      let luminance = Math.floor(
          0.2126 * data[i]
        + 0.7152 * data[i + 1]
        + 0.0722 * data[i + 2]
      );

      greyData[index++] = luminance;
    }

    return greyData;
  }


  private getEdge(data: Uint8ClampedArray, startX: number, startY: number): Edge {
    let edge = this.getEdgeType(data, startX, startY);
    return edge != null ? this.makeEdge(edge, startX, startY) : null;
  }


  private getEdgeType(data: Uint8ClampedArray, startX: number, startY: number): number {
    let block = [0, 0, 0, 0];
    let index = startY * this.width + startX;
    let row = this.width - this.blockSize;

    for (let y = 0; y < this.blockSize; y++) {
      for (let x = 0; x < this.blockSize; x++) {
        let section = (y >= this.sectionSize ? 2 : 0)
          + (x >= this.sectionSize ? 1 : 0);
        
        block[section] += data[index++];
      }

      index += row;
    }

    for (let i = 0; i < block.length; i++) {
      block[i] /= this.blockSectionPixelCount;
    }

    let edge = maxIndex(
      [
        // vertical
        Math.abs(block[0] + block[2] - (block[1] + block[3])),
        // horizontal
        Math.abs(block[0] + block[1] - (block[2] + block[3])),
        // 45 degree diagonal
        Math.abs(Math.sqrt(2) * (block[0] - block[3])),
        // 135 degree diagonal
        Math.abs(Math.sqrt(2) * (block[1] - block[2])),
        // non-directional
        Math.abs(2 * (block[0] - block[1] - block[2] + block[3]))
      ],
      this.edgeThreshold
    );

    return edge;
  }


  private makeEdge(edge: number, startX: number, startY: number): Edge {
    switch (edge) {
      case 0:
        const x = startX + this.sectionSize;

        return {
          edge,
          a: {x, y: startY},
          b: {x, y: startY + this.blockSize}
        };

      case 1:
        const y = startY + this.sectionSize;

        return {
          edge,
          a: {x: startX, y},
          b: {x: startX + this.blockSize, y}
        };

      case 2:
        return {
          edge,
          a: {x: startX + this.blockSize, y: startY},
          b: {x: startX, y: startY + this.blockSize}
        };

      case 4:
        return {
          edge,
          a: {x: startX, y: startY},
          b: {x: startX + this.blockSize, y: startY + this.blockSize}
        };

      default:
        return null;
    }
  }
};


const maxIndex = (array: number[], threshold=Number.NEGATIVE_INFINITY) => {
  let item = null;

  array.forEach((value, index) => {
    if (value > threshold) {
      item = index;
      threshold = value;
    }
  });

  return item;
};
