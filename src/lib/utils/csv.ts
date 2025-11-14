export type CsvValue = string | number | boolean | null | undefined;

export function toCSVRow(obj: Record<string, CsvValue>): string {
  const esc = (v: CsvValue) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return (
    Object.keys(obj)
      .map((k) => esc(obj[k]))
      .join(',') + '\n'
  );
}
