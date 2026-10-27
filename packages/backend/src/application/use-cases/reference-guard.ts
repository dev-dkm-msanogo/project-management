import { ConflictError } from '@application/errors/application-errors';

/** Une entrée d'un document du projet en cite une autre par son code (ex. H-002 cite R-003). */
export interface Citation {
  /** Code cité : risque, partie prenante, demande, métrique, élément de WBS… */
  code: string;
  /** Document qui cite, avec son article : « le journal des problèmes ». */
  document: string;
  /** Code de l'entrée qui cite, quand le document en a plusieurs. */
  from?: string;
}

/** Citations que contient un document du projet. */
export type CitationSource = (projectId: string) => Promise<Citation[]>;

interface Readable<T> {
  findByProjectId(projectId: string): Promise<T | null>;
}

const upper = (code: string) => code.toUpperCase();

const enumerate = (items: readonly string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;

/** « le registre des hypothèses et contraintes (H-002) et le journal des problèmes (I-004) » */
function citers(citations: readonly Citation[]): string {
  const byDocument = new Map<string, string[]>();
  for (const citation of citations) {
    const froms = byDocument.get(citation.document) ?? [];
    if (citation.from && !froms.includes(citation.from)) froms.push(citation.from);
    byDocument.set(citation.document, froms);
  }
  return enumerate([...byDocument].map(([document, froms]) => (froms.length > 0 ? `${document} (${froms.join(', ')})` : document)));
}

/** « R-003 est cité par … » ; les codes cités par les mêmes documents sont regroupés : « QM-001 et QM-002 sont cités par … ». */
function describe(cited: readonly { code: string; citations: readonly Citation[] }[]): string[] {
  const byCiters = new Map<string, string[]>();
  for (const { code, citations } of cited) {
    const key = citers(citations);
    byCiters.set(key, [...(byCiters.get(key) ?? []), code]);
  }
  return [...byCiters].map(([by, codes]) => `${enumerate(codes)} ${codes.length > 1 ? 'sont cités' : 'est cité'} par ${by}`);
}

/**
 * Intégrité référentielle « RESTRICT » d'un document source (registre des risques, des parties
 * prenantes, WBS…) : retirer ou renommer une entrée encore citée ailleurs dans le projet est refusé
 * (409) en nommant les citations à retirer d'abord. Seules les entrées retirées par l'opération sont
 * contrôlées : une citation déjà orpheline ne bloque pas les autres modifications.
 */
export function referenceGuard<T>(
  repository: Readable<T>,
  codesOf: (document: T) => readonly string[],
  sources: readonly CitationSource[],
) {
  const assertUncited = async (projectId: string, removed: readonly string[]): Promise<void> => {
    if (removed.length === 0) return;
    const gone = new Map(removed.map((code) => [upper(code), code]));
    const citations = (await Promise.all(sources.map((source) => source(projectId))))
      .flat()
      .filter((citation) => gone.has(upper(citation.code)));
    if (citations.length === 0) return;
    const cited = [...gone]
      .map(([key, code]) => ({ code, citations: citations.filter((citation) => upper(citation.code) === key) }))
      .filter((entry) => entry.citations.length > 0);
    throw new ConflictError(`${describe(cited).join(' ; ')}. Retirez d'abord ces références, puis recommencez.`);
  };

  return {
    /** Avant d'enregistrer `next` : les entrées qu'il retire ne doivent plus être citées. */
    beforeSave: async (projectId: string, next: T): Promise<void> => {
      const previous = await repository.findByProjectId(projectId);
      if (!previous) return;
      const kept = new Set(codesOf(next).map(upper));
      await assertUncited(projectId, codesOf(previous).filter((code) => !kept.has(upper(code))));
    },
    /** Avant de supprimer le document : aucune de ses entrées ne doit plus être citée. */
    beforeDelete: async (projectId: string): Promise<void> => {
      const current = await repository.findByProjectId(projectId);
      if (current) await assertUncited(projectId, codesOf(current));
    },
  };
}
