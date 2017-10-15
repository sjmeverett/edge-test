import * as _ from 'lodash';


export const getComplexity = (descriptor: Float32Array) => 
  Math.exp(descriptor.reduce(
    (acc, d) => d != 0 ? acc - d * Math.log(d) : acc
  ));


export const merge = (a: Float32Array, b: Float32Array) =>
  new Float32Array(<number[]>_.zipWith(a, b, (a: number, b: number) => (a + b) / 2));


export const SED_POWER = 0.483;


export function getSedDistance(a: Float32Array, b: Float32Array) {
  let e1 = getComplexity(a);
  let e2 = getComplexity(b);
  let e3 = getComplexity(merge(a, b));
  let t1 = Math.max(0, Math.min(1, (e3 / Math.sqrt(e1 * e2)) - 1));
  return Math.pow(t1, SED_POWER);
};
