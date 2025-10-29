export const formatNumber = (
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {}
) => {
  if (value == null || Number.isNaN(value)) return "n/a";
  return new Intl.NumberFormat(undefined, options).format(value);
};

export const formatAverage = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(2)} / 5.0`;
};

export const formatPercentage = (value: number) => `${value.toFixed(0)}%`;
