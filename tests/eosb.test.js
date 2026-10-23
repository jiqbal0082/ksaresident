import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEOSB, baseAwardMonths, resignationFraction, serviceYears, REASONS,
} from '../src/lib/eosb.js';

test('Art. 84: half month per year for first 5 years', () => {
  assert.equal(baseAwardMonths(5), 2.5);
  assert.equal(baseAwardMonths(3), 1.5);
});

test('Art. 84: full month per year after 5 years', () => {
  assert.equal(baseAwardMonths(10), 7.5);
  assert.equal(baseAwardMonths(7.5), 5);
});

test('Art. 85 resignation fractions at boundaries', () => {
  assert.equal(resignationFraction(1.99), 0);
  assert.equal(resignationFraction(2), 1 / 3);
  assert.equal(resignationFraction(5), 1 / 3);
  assert.equal(resignationFraction(5.01), 2 / 3);
  assert.equal(resignationFraction(9.99), 2 / 3);
  assert.equal(resignationFraction(10), 1);
});

test('Termination after 4 years at 3,000 SAR = 6,000', () => {
  const r = calculateEOSB({ monthlyWage: 3000, years: 4, reason: REASONS.EMPLOYER_TERMINATION });
  assert.equal(r.award, 6000);
});

test('Resignation after 4 years at 3,000 SAR = one third = 2,000', () => {
  const r = calculateEOSB({ monthlyWage: 3000, years: 4, reason: REASONS.RESIGNATION });
  assert.equal(r.award, 2000);
});

test('Resignation after 8 years at 10,000 SAR = 2/3 of 55,000', () => {
  const r = calculateEOSB({ monthlyWage: 10000, years: 8, reason: REASONS.RESIGNATION });
  assert.equal(r.award, 36666.67);
});

test('Resignation under 2 years = 0', () => {
  const r = calculateEOSB({ monthlyWage: 5000, years: 1.5, reason: REASONS.RESIGNATION });
  assert.equal(r.award, 0);
});

test('Art. 87 childbirth exception pays full despite resignation', () => {
  const r = calculateEOSB({ monthlyWage: 6000, years: 3, reason: REASONS.FEMALE_CHILDBIRTH_ART87 });
  assert.equal(r.award, 9000);
});

test('Art. 80 dismissal and Art. 54 probation pay nothing', () => {
  assert.equal(calculateEOSB({ monthlyWage: 6000, years: 6, reason: REASONS.DISMISSAL_ART80 }).award, 0);
  assert.equal(calculateEOSB({ monthlyWage: 6000, years: 0.3, reason: REASONS.PROBATION_ART54 }).award, 0);
});

test('serviceYears from dates (inclusive)', () => {
  assert.equal(serviceYears('2025-01-01', '2025-12-31'), 1);
});

test('Rejects bad input', () => {
  assert.throws(() => calculateEOSB({ monthlyWage: 0, years: 3, reason: REASONS.RESIGNATION }));
  assert.throws(() => calculateEOSB({ monthlyWage: 1000, years: 3, reason: 'nope' }));
  assert.throws(() => serviceYears('2026-01-01', '2025-01-01'));
});
