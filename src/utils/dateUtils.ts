export function parseEmailDate(dateString: string): Date {
  return new Date(dateString);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isRecent(date: Date, daysBack: number = 30): boolean {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const daysDiff = diff / (1000 * 60 * 60 * 24);
  return daysDiff <= daysBack;
}

export function normalizeToLocalDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').reverse().join('-');
}