export const formatCompact = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatPercent = (value: number, digits = 1): string => {
  return `${(value * 100).toFixed(digits)}%`;
};
