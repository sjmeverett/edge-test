import * as _ from 'lodash';
import { Edge } from './edge-detector';
import * as kdbush from 'kdbush';

const threshold = 30;
const cornerThreshold = 25;

export interface Line extends Edge {
  length?: number;
};

interface Point {
  x: number;
  y: number;
}

interface Cluster {
  centre: Point;
  points: PointInfo[];
}

interface PointInfo {
  edge: Edge;
  key: 'a' | 'b';
  point: Point;
  cluster: Cluster;
}


const buildIndex = (edges: Edge[], point: 'a' | 'b') => kdbush(
  edges,
  (e: Edge) => e[point].x,
  (e: Edge) => e[point].y,
  64,
  Uint32Array
);


export default class BoxDetector {
  constructor() {

  }


  getBoxes(edges: Edge[]) {
    const verticals = this.getLines(edges, 0);
    const horizontals = this.getLines(edges, 1);
    const haIndex = buildIndex(horizontals, 'a');
    const vaIndex = buildIndex(verticals, 'a');
    const vbIndex = buildIndex(verticals, 'b');
    let boxes = [];

    for (let v of verticals) {
      let topI = haIndex.within(v.a.x, v.a.y, cornerThreshold)[0];

      if (topI != null) {
        let bottomI = haIndex.within(v.b.x, v.b.y, cornerThreshold)[0];

        if (bottomI != null) {
          let top = horizontals[topI];
          let bottom = horizontals[bottomI];
          let a = vaIndex.within(top.b.x, top.b.y, cornerThreshold);
          let b = vbIndex.within(bottom.b.x, bottom.b.y, cornerThreshold);
          let i = _.intersection(a, b)[0];

          if (i) {
            boxes.push([
              top.a,
              top.b,
              bottom.b,
              bottom.a
            ]);
          }
        }
      }
    }

    return boxes;
  }

  getLinesForDirection(edges: Edge[], edgeType: number) {
    const points = <PointInfo[]>_.flatMap(
      edges.filter((edge) => edge.edge === edgeType),

      (edge) => [
        {edge, key: 'a', point: edge.a, cluster: null},
        {edge, key: 'b', point: edge.b, cluster: null}
      ]
    );

    const index = kdbush(points, (p) => p.point.x, (p) => p.point.y, 64, Uint32Array);
    let clusters: Cluster[] = [];

    for (let point of points) {
      if (point.cluster) continue;

      let neighbours = <PointInfo[]>index.within(point.point.x, point.point.y, threshold)
        .map((id) => points[id]);

      let cluster: Cluster = {
        centre: point.point,
        points: []
      };

      let overlappingClusters = <Cluster[]>_.uniq(
        neighbours
          .filter((n) => n.cluster != null)
          .map((n) => n.cluster)
      );

      let clusterPoints = _.flatMap(overlappingClusters, (cluster) => cluster.points)
        .concat(neighbours.filter((n) => n.cluster === null));

      clusterPoints.forEach((p) => p.cluster = cluster);
      cluster.points.push(...clusterPoints);

      clusters = clusters.filter((c) => overlappingClusters.indexOf(c) === -1);
      clusters.push(cluster);
    }

    clusters.forEach((cluster) => {
      let x = _.meanBy(cluster.points, (p) => p.point.x);
      let y = _.meanBy(cluster.points, (p) => p.point.y);
      let point: Point = {x, y};

      cluster.points.forEach((info: PointInfo) => {
        info.edge[info.key] = point;
      });
    });

    return clusters;
  }


  getLines(edges: Edge[], edgeType: number) {
    edges = edges.filter((edge) => edge.edge === edgeType);
    const index = buildIndex(edges, 'a');
    let lines: Line[] = [];

    for (let edge of edges) {
      if (edge.visited) continue;
      let line = this.getLine(index, edges, edge);

      if (line.length > 2)
        lines.push(line);
    }

    return lines;
  }


  getLine(index, edges: Edge[], edge: Edge): Line {
    let length = 1;
    let queue: {edge: Edge, length: number}[] = [{edge, length}];
    let max = queue[0];

    while (queue.length) {
      let item = queue.shift();
      item.edge.visited = true;
      
      if (item.length > max.length)
        max = item;

      length++;

      let neighbours = <typeof queue>index.within(item.edge.b.x, item.edge.b.y, threshold)
        .map((id) => edges[id])
        .filter((edge) => edge !== item.edge && !edge.visited)
        .map((edge) => ({edge, length}));

      queue.push(...neighbours);
    }

    return {
      a: edge.a,
      b: max.edge.b,
      edge: edge.edge,
      length: max.length
    };
  }


  getLines2(edges: Edge[], edgeType: number) {
    const [axis1, axis2] = edgeType === 0 ? ['y', 'x'] : ['x', 'y'];

    edges = edges
      .filter((edge) => edge.edge === edgeType)
      .sort((a, b) => a.a[axis2] === b.a[axis2] ? a.a[axis1] - b.a[axis1] : a.a[axis2] - b.a[axis2]);
    
    let line: Line = edges[0];
    let lines: Line[] = [];

    for (let edge of edges) {
      if (Math.abs(edge.a[axis2] - line.b[axis2]) < threshold
          && Math.abs(edge.a[axis1] - line.b[axis1]) < threshold) {

        line.b[axis1] = edge.b[axis1];
        line.b[axis2] = edge.b[axis2];
        line.length = (line.length || 0) + 1;

      } else {
        lines.push(line);
        line = edge;
      }
    }

    return lines
      .filter((line) => line.length > 4);
  }
};


const mergeClusters = (dest: Cluster, sources: Cluster[], master: Cluster[]) => {
  dest.points.push(..._.flatMap(sources, (cluster) => cluster.points));
}
