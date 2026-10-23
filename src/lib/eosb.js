/**
 * End-of-Service Benefit (EOSB) calculator — Saudi Labor Law, Articles 84–88.
 *
 * Article 84: half a month's wage for each of the first 5 years,
 *             one full month's wage for each year after that.
 *             Part-years are pro-rated. Based on the LAST wage.
 * Article 85: on resignation the Art. 84 award is reduced:
 *             < 2 years           -> nothing
 *             2 to 5 years        -> 1/3
 *             more than 5, < 10   -> 2/3
 *             10 years or more    -> full
 * Article 87: full award despite resignation for force majeure, or a
 *             female worker within 6 months of marriage / 3 months of childbirth.
 * Article 81: employee leaves because the employer breached obligations -> full.
 * Article 80: dismissal for listed misconduct -> no award.
 * Article 54: termination during probation -> no award.
 *
 * The 2025 amendments (effective 19 Feb 2025) did not change Articles 84–88.
 * Last verified: 2026-10-23. Not legal advice — confirm on the official HRSD calculator.
 */

export const REASONS = Object.freeze({
  EMPLOYER_TERMINATION: 'employer_termination',
  CONTRACT_END: 'contract_end',
  RESIGNATION: 'resignation',
  EMPLOYER_BREACH_ART81: 'employer_breach_art81',
  FORCE_MAJEURE_ART87: 'force_majeure_art87',
  FEMALE_MARRIAGE_ART87: 'female_marriage_art87',
  FEMALE_CHILDBIRTH_ART87: 'female_childbirth_art87',
  DISMISSAL_ART80: 'dismissal_art80',
  PROBATION_ART54: 'probation_art54',
});

const FULL_AWARD = new Set([
  REASONS.EMPLOYER_TERMINATION,
  REASONS.CONTRACT_END,
  REASONS.EMPLOYER_BREACH_ART81,
  REASONS.FORCE_MAJEURE_ART87,
  REASONS.FEMALE_MARRIAGE_ART87,
  REASONS.FEMALE_CHILDBIRTH_ART87,
]);

const NO_AWARD = new Set([REASONS.DISMISSAL_ART80, REASONS.PROBATION_ART54]);

const MS_PER_DAY = 86_400_000;
const DAYS_PER_YEAR = 365;

/** Service length in years (fractional) between two ISO dates, end date inclusive. */
export function serviceYears(startDate, endDate) {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) throw new Error('Invalid date');
  if (end < start) throw new Error('End date is before start date');
  const days = Math.round((end - start) / MS_PER_DAY) + 1;
  return days / DAYS_PER_YEAR;
}

/** Article 84 base award, in months of wage. */
export function baseAwardMonths(years) {
  if (years < 0) throw new Error('Years must be >= 0');
  const firstFive = Math.min(years, 5) * 0.5;
  const afterFive = Math.max(years - 5, 0) * 1;
  return firstFive + afterFive;
}

/** Article 85 fraction applied on resignation. */
export function resignationFraction(years) {
  if (years < 2) return 0;
  if (years <= 5) return 1 / 3;
  if (years < 10) return 2 / 3;
  return 1;
}

/**
 * @param {object} input
 * @param {number} input.monthlyWage  Last monthly wage in SAR (basic + regular allowances)
 * @param {number} [input.years]      Service in years (use this OR start/end dates)
 * @param {string} [input.startDate]  ISO date, e.g. "2019-03-01"
 * @param {string} [input.endDate]    ISO date, e.g. "2026-10-23"
 * @param {string} input.reason       One of REASONS
 * @returns {{years:number, baseMonths:number, fraction:number, award:number, basis:string}}
 */
export function calculateEOSB({ monthlyWage, years, startDate, endDate, reason }) {
  if (!(monthlyWage > 0)) throw new Error('monthlyWage must be a positive number');
  if (!Object.values(REASONS).includes(reason)) throw new Error(`Unknown reason: ${reason}`);

  const y = years ?? serviceYears(startDate, endDate);
  const baseMonths = baseAwardMonths(y);

  let fraction;
  let basis;
  if (NO_AWARD.has(reason)) {
    fraction = 0;
    basis = reason === REASONS.PROBATION_ART54 ? 'Article 54' : 'Article 80';
  } else if (FULL_AWARD.has(reason)) {
    fraction = 1;
    basis = reason.endsWith('art87') ? 'Articles 84 & 87'
      : reason.endsWith('art81') ? 'Articles 84 & 81' : 'Article 84';
  } else {
    fraction = resignationFraction(y);
    basis = 'Articles 84 & 85';
  }

  const award = round2(baseMonths * monthlyWage * fraction);
  return { years: round4(y), baseMonths: round4(baseMonths), fraction, award, basis };
}

const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10_000) / 10_000;
