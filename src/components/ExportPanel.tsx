'use client';

type Props = { title?: string; row: Record<string, any> };

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const btn =
  'px-3 py-2 rounded-md border text-sm ' +
  'bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-50 ' +
  'dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800';

export default function ExportPanel({ title = 'Export', row }: Props) {
  const exportCSV = () => {
    if (!row || typeof row !== 'object') {
      alert('Nothing to export.');
      return;
    }
    const headers = Object.keys(row);
    const values = headers.map((k) => {
      const s = row[k] == null ? '' : String(row[k]).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    });
    const csv = headers.join(',') + '\n' + values.join(',');
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `${title.toLowerCase().replace(/\s+/g, '-')}.csv`,
    );
  };

  const exportPDF = async () => {
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, rows: [row] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      downloadBlob(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF export failed. CSV still works.');
    }
  };

  return (
    <div className="mt-3 inline-flex flex-wrap items-center gap-2">
      <button className={btn} onClick={exportCSV}>
        Export CSV
      </button>
      <button className={btn} onClick={exportPDF}>
        Export PDF
      </button>
    </div>
  );
}
