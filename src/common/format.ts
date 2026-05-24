export const formatThousands = (value: number): string =>
  value.toLocaleString("en-US");

export const formatCompactViews = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} K`;
  }
  return String(value);
};
