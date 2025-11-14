'use client';

type ExportableValue = string | number | boolean | null | undefined;

type Props = {
  title: string;
  row: Record<string, ExportableValue>;
};

export default function ExportPanel({ title, row }: Props) {
  const exportCsv = () => {
    try {
      const rows = [row];
      if (!rows.length) {
        alert('Nothing to export');
        return;
      }
      const headers = Object.keys(rows[0] ?? {});
      if (!headers.length) {
        alert('Nothing to export');
        return;
      }

      const lines = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
      ];

      const blob = new Blob([lines.join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('CSV export failed');
    }
  };

  const exportPdfSoon = () => {
    alert('PDF export coming soon.\nFor now, export CSV or take a screenshot.');
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className="btn" onClick={exportCsv}>
        Export CSV
      </button>
      <button
        type="button"
        className="btn-outline opacity-60 cursor-not-allowed"
        disabled
        onClick={exportPdfSoon}
      >
        Export PDF (coming soon)
      </button>
    </div>
  );
}
