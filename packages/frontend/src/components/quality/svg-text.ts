/** Découpe un libellé en lignes d'au plus `max` caractères (mots entiers), `lines` lignes au plus. */
export function wrapText(text: string, max: number, lines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const result: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > max && current) {
      result.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) result.push(current);
  if (result.length <= lines) return result;
  const kept = result.slice(0, lines);
  kept[lines - 1] = `${kept[lines - 1]!.slice(0, max - 1)}…`;
  return kept;
}

/** Tronque un libellé trop long pour une seule ligne. */
export const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
