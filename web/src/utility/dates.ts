const suffixes: Record<string, string> = {
  one: 'st',
  two: 'nd',
  few: 'rd',
  other: 'th',
};
const ordinalRules = new Intl.PluralRules('en', { type: 'ordinal' });

export function formatDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = date.getDate();
  const suffix = suffixes[ordinalRules.select(day)];
  const monthYear = date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
  return `${weekday} ${day}${suffix} ${monthYear}`;
}
