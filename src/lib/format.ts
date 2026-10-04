const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatEuro(cents: number | null | undefined): string {
  if (cents == null) return "–";
  return euroFormatter.format(cents / 100);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "–";
  return dateFormatter.format(new Date(date));
}

/** "YYYY-MM-DD" for <input type="date"> */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}
