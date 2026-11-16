// Same as the backend's src/common/distribution/rescale-shares.ts. Keep both
// in step.
//
// Scales the remaining agents' shares so they add up to `total` again, in
// proportion to what each one had, as whole numbers.
//
// Rounding: every share is first rounded down. The points still missing go,
// one each, to the agents with the SMALLEST exact share first, so the smaller
// shares round up and the larger ones round down.
//
//   [30, 30] -> [50, 50]
//   [40, 30] -> exact [57.14, 42.86] -> [57, 43]
//
// Shares of 0 stay 0. If every share is 0, the total is split evenly.
export function rescaleShares(shares: readonly number[], total = 100): number[] {
  if (shares.length === 0) return [];
  const sum = shares.reduce((acc, s) => acc + Math.max(0, s), 0);
  const exact =
    sum > 0
      ? shares.map((s) => (Math.max(0, s) * total) / sum)
      : shares.map(() => total / shares.length);

  const out = exact.map((v) => Math.floor(v + 1e-9));
  const missing = total - out.reduce((acc, v) => acc + v, 0);

  // Only shares with a fractional part can take a point; there are always at
  // least `missing` of them, because their fractions add up to `missing`.
  const order = exact
    .map((value, index) => ({ value, index }))
    .filter(({ value, index }) => value - out[index] > 1e-9)
    .sort((a, b) => a.value - b.value || a.index - b.index);
  for (let i = 0; i < missing && i < order.length; i++) out[order[i].index] += 1;
  return out;
}
