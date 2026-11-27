/** Builds a CSV string from rows of primitives and triggers a browser download. No library
 * needed for a flat table like this — see CLAUDE.md's reuse-before-building principle. */
export function downloadCsv(
  filename: string,
  columns: readonly string[],
  rows: readonly (readonly (string | number)[])[],
): void {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns, ...rows].map((row) => row.map(escape).join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
