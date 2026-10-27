/**
 * Méthodologie d'un projet : prédictive (WBS et échéancier), adaptative (carnet de produit et
 * itérations) ou hybride (les deux, l'avancement des lots itératifs venant du carnet).
 */
export const PROJECT_METHODOLOGIES = ['PREDICTIVE', 'HYBRID', 'ADAPTIVE'] as const;

export type ProjectMethodology = (typeof PROJECT_METHODOLOGIES)[number];

export function isProjectMethodology(value: string): value is ProjectMethodology {
  return (PROJECT_METHODOLOGIES as readonly string[]).includes(value);
}
