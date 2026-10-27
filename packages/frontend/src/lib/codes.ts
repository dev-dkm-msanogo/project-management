/** Code suivant au format PRÉFIXE-001 (ex. R-004, PP-009), à partir des codes existants. */
export function nextCode(entries: readonly { code: string }[], prefix: string): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  const max = entries.reduce((highest, entry) => {
    const match = pattern.exec(entry.code.trim());
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
