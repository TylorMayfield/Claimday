import type { Settlement } from '../types';

export type EligibilityInput = {
  states: string[];
  keywords: string[];
};

export function evaluateSettlement(settlement: Settlement, profile: EligibilityInput) {
  let score = 45;
  const reasons: string[] = [];

  const normalizedStates = (profile.states ?? []).map((s) => s.toLowerCase());

  if (settlement.stateTags.length) {
    if (normalizedStates.length && settlement.stateTags.some((tag) => normalizedStates.includes(tag.toLowerCase()))) {
      score += 30;
      reasons.push('one of your states matches the location requirement.');
    } else if (normalizedStates.length) {
      score -= 30;
      reasons.push('none of your states match the location requirement.');
    } else {
      reasons.push('state could matter here, but none have been provided yet.');
    }
  }

  const normalizedKeywords = profile.keywords.map((k) => k.toLowerCase());
  const matchedKeywords = settlement.keywordTags.filter((tag) =>
    normalizedKeywords.some(
      (kw) => tag.toLowerCase().includes(kw) || kw.includes(tag.toLowerCase()),
    ),
  );
  if (matchedKeywords.length) {
    score += Math.min(25, matchedKeywords.length * 8);
    reasons.push(`your keywords match ${matchedKeywords.slice(0, 3).join(', ')}.`);
  } else if (profile.keywords.length > 0) {
    score -= 10;
    reasons.push('your keywords do not clearly match this settlement.');
  }

  score = Math.max(0, Math.min(100, score));

  let label = 'Possible fit';
  if (score >= 75) {
    label = 'Likely eligible';
  } else if (score < 45) {
    label = 'Needs review';
  }

  const reason =
    reasons[0] ??
    'The settlement text did not expose enough structured detail to make this more than a first-pass screen.';

  return { score, label, reason };
}
