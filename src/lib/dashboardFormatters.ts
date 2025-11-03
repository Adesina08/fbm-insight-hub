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

export const formatLastUpdated = (timestamp?: string) => {
  if (!timestamp) {
    return "Never";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
};
