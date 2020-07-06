import * as _ from "lodash";

type Fingerprint = number[];
type SongID = string;

interface Song {
  id: SongID;
  fingerprint: Fingerprint;
}

function findMatchingPositions(
  sample: Fingerprint,
  base: Fingerprint
): [number[], number[]] {
  const r1: number[] = [];
  const r2: number[] = [];
  // console.log(`Length sample ${sample.length}, Length base ${base.length}`);
  base.forEach((val, index) => {
    const otherIndex = _.indexOf(sample, val);
    if (otherIndex > -1) {
      r1.push(otherIndex);
      r2.push(index);
    }
  });
  return [r1, r2];
}

function makeSlices(positions: number[]): [number, number][] {
  const slices: [number, number][] = [];
  while (positions.length > 1) {
    const start = positions[0];
    while (positions[0] + 1 === positions[1]) positions = _.tail(positions);
    const r: [number, number] = [start, positions[0]];
    slices.push(r);
    positions = _.tail(positions);
  }
  return slices;
}

function compareFingerprints(sample: Fingerprint, base: Fingerprint): number {
  const [sp, bp] = findMatchingPositions(sample, base);
  if (sp.length === 0) return Infinity;
  const diffs: number[] = [];
  const ss = makeSlices(sp);
  const bs = makeSlices(bp);
  for (const [sampleRange, baseRange] of _.zip(ss, bs)) {
    if (_.isUndefined(sampleRange) || _.isUndefined(baseRange)) continue;
    const [sampleStart, sampleEnd] = sampleRange;
    const [baseStart, baseEnd] = baseRange;
    if (sampleStart === sampleEnd && baseStart === baseEnd) {
      diffs.push(Math.abs(sample[sampleStart] - base[baseStart]));
    } else {
      const sampleRegion = _.slice(sample, sampleStart, sampleEnd + 1);
      const baseRegion = _.slice(base, baseStart, baseEnd + 1);
      const localDiff = _.zipWith(
        sampleRegion,
        baseRegion,
        _.flowRight([Math.abs, _.subtract])
      );
      diffs.push(_.mean(localDiff));
    }
  }
  return _.mean(diffs);
}

export default compareFingerprints;
