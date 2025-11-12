export function toCSVRow(obj: Record<string, any>): string {
  const esc = (v: any) => {
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
