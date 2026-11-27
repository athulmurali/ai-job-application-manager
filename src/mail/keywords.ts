/** Keywords that mark an email as possibly job-related. Shared by all providers. */
export const JOB_KEYWORDS: string[] = [
  'interview',
  'application',
  'feedback',
  'availability',
  'position',
  'job',
  'offer',
  'rejection',
  'thank you for your interest',
  'next steps',
  'coding challenge',
  'technical interview',
  'recruiter',
  'hiring',
  'opportunity',
];

export function matchesKeywords(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const haystack = text.toLowerCase();
  return keywords.some(keyword => haystack.includes(keyword.toLowerCase()));
}
