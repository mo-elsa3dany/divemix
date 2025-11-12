'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { toCSVRow } from '@/lib/utils/csv';

export default function ExportPanel({
  title,
  row,
}: {
  title: string;
  row: Record<string, any>;
}) {
  function exportCSV() {
    const header = Object.keys(row).join(',') + '\n';
    const csv = header + toCSVRow(row);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
  }

  function exportPDF() {
    const lines = Object.entries(row)
      .map(([k, v]) => `${k}: ${v}`)
      .join('|');
    const url = `/api/pdf?title=${encodeURIComponent(title)}&lines=${encodeURIComponent(lines)}`;
    const a = document.createElement('a');
    a.href = url;
    a.click();
  }

  return (
    <section className="card space-y-3">
      <div className="font-medium">Exports</div>
      <div className="flex gap-2">
        <button className="btn" onClick={exportCSV}>
          Export .csv
        </button>
        <button className="btn" onClick={exportPDF}>
          Export PDF
        </button>
      </div>
    </section>
  );
}
