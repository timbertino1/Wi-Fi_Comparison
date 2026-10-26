// Pure formulas used to recompute derived claims (research.md R16). A derived claim names one of
// these functions in `derivation.formula`; its inputs are the values of other (stated) claims.

/** Peak PHY rate in Mbps: N_SS × N_SD × N_BPSCS × R ÷ (T_DFT + T_GI), with times in µs. */
export function phyRate({ nss, nsd, bits, codingRate, symbolUs, giUs }) {
  return (nss * nsd * bits * codingRate) / (symbolUs + giUs);
}

/**
 * Number of non-overlapping channels of `widthMHz` that fit between the band edges, with channel
 * edges on a raster that starts at `firstEdgeMHz` and repeats every `widthMHz`.
 */
export function channelCount({ bandStartMHz, bandEndMHz, widthMHz, firstEdgeMHz = bandStartMHz }) {
  const start = Math.max(bandStartMHz, firstEdgeMHz);
  return Math.max(0, Math.floor((bandEndMHz - start) / widthMHz));
}

/** Percentage gain of `a` over `b`: (a / b − 1) × 100. */
export function percentGain({ a, b }) {
  return (a / b - 1) * 100;
}

/** Ratio a ÷ b. */
export function ratio({ a, b }) {
  return a / b;
}

/** Product of all inputs (e.g., per-stream rate × streams). */
export function product(inputs) {
  return Object.values(inputs).reduce((acc, v) => acc * v, 1);
}

/** Unit scaling applied after a formula (e.g., Mbps → Gbps). */
const SCALE = { Mbps: 1, Gbps: 1 / 1000 };

/**
 * Rounds a value per a claim's `rounding` spec: `{ decimals, unit? }`. When `unit` is given the
 * value is assumed to be in Mbps and converted first.
 */
export function round(value, rounding = {}) {
  const scaled = rounding.unit ? value * (SCALE[rounding.unit] ?? 1) : value;
  const decimals = rounding.decimals ?? 0;
  const f = 10 ** decimals;
  return Math.round(scaled * f) / f;
}

export const formulas = { phyRate, channelCount, percentGain, ratio, product };

/** Recomputes a derived claim from resolved input values. */
export function recompute(formula, inputValues, rounding) {
  const fn = formulas[formula];
  if (!fn) throw new Error(`Unknown formula "${formula}"`);
  return round(fn(inputValues), rounding);
}
