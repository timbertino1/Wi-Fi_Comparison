import test from 'node:test';
import assert from 'node:assert/strict';
import { phyRate, channelCount, percentGain, round, recompute } from '../../scripts/derivations.mjs';

// Worked values from research.md R16.
const gens = {
  wifi4: { nss: 4, nsd: 108, bits: 6, codingRate: 5 / 6, symbolUs: 3.2, giUs: 0.4, perStream: 150.0, peak: [600, { decimals: 0 }] },
  wifi5: { nss: 8, nsd: 468, bits: 8, codingRate: 5 / 6, symbolUs: 3.2, giUs: 0.4, perStream: 866.7, peak: [6.93, { decimals: 2, unit: 'Gbps' }] },
  wifi6: { nss: 8, nsd: 1960, bits: 10, codingRate: 5 / 6, symbolUs: 12.8, giUs: 0.8, perStream: 1201.0, peak: [9.61, { decimals: 2, unit: 'Gbps' }] },
  wifi7: { nss: 8, nsd: 3920, bits: 12, codingRate: 5 / 6, symbolUs: 12.8, giUs: 0.8, perStream: 2882.4, peak: [23.1, { decimals: 1, unit: 'Gbps' }] }
};

for (const [gen, p] of Object.entries(gens)) {
  test(`${gen} per-stream and peak PHY rate`, () => {
    assert.equal(round(phyRate({ ...p, nss: 1 }), { decimals: 1 }), p.perStream);
    const [peak, rounding] = p.peak;
    assert.equal(recompute('phyRate', p, rounding), peak);
  });
}

test('4096-QAM vs 1024-QAM peak-rate gain is 20%', () => {
  assert.equal(round(percentGain({ a: 12, b: 10 }), { decimals: 0 }), 20);
});

test('US 6 GHz (5925–7125 MHz) channel counts per width', () => {
  // 20 MHz channels start at 5945 MHz (channel 1 centred on 5955 MHz); wider channels align to the
  // same raster, and 320 MHz counts non-overlapping channels only.
  const band = { bandStartMHz: 5925, bandEndMHz: 7125, firstEdgeMHz: 5945 };
  const expected = { 20: 59, 40: 29, 80: 14, 160: 7, 320: 3 };
  for (const [width, count] of Object.entries(expected)) {
    assert.equal(channelCount({ ...band, widthMHz: Number(width) }), count, `${width} MHz`);
  }
});

test('unknown formula is rejected', () => {
  assert.throws(() => recompute('nope', {}, {}), /Unknown formula/);
});
