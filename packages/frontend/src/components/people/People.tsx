import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { DirectoryResourceDto } from '@shared/index';
import { useResourceDirectory } from '@/hooks/useAdministration';

/**
 * Personnes de l'organisation : le référentiel des ressources, chargé une fois pour toute
 * l'application. Les documents désignent chaque personne par l'identifiant de sa ressource.
 */
interface PeopleContextValue {
  resources: DirectoryResourceDto[];
  byId: ReadonlyMap<string, DirectoryResourceDto>;
  loading: boolean;
  /** À appeler après une modification du référentiel. */
  reload: () => void;
}

const PeopleContext = createContext<PeopleContextValue>({ resources: [], byId: new Map(), loading: true, reload: () => {} });

export function PeopleProvider({ children }: { children: ReactNode }) {
  const { data, loading, reload } = useResourceDirectory();
  const value = useMemo(() => {
    const resources = [...(data?.resources ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return { resources, byId: new Map(resources.map((resource) => [resource.id, resource])), loading, reload };
  }, [data, loading, reload]);
  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export const usePeople = () => useContext(PeopleContext);

/** Nom d'une personne pour un texte (recherche, titre) ; identifiant inconnu : la valeur telle quelle. */
export function usePersonName(): (id: string | null | undefined) => string {
  const { byId } = usePeople();
  return (id) => (id ? (byId.get(id)?.name ?? id) : '');
}

/**
 * Personne affichée par son nom (fonction en info-bulle). Une valeur absente du référentiel — nom
 * saisi avant la sélection — reste lisible, signalée « à rattacher ».
 */
export function PersonName({ id, empty = '—' }: { id: string | null | undefined; empty?: string }) {
  const { byId, loading } = usePeople();
  if (!id) return <>{empty}</>;
  const resource = byId.get(id);
  if (resource) {
    return <span title={[resource.jobTitle, resource.department].filter(Boolean).join(' · ') || undefined}>{resource.name}</span>;
  }
  if (loading) return <>…</>;
  return (
    <span className="person-unlinked" title="Absent du référentiel des ressources : choisissez une ressource dans l'éditeur.">
      {id} <span className="person-unlinked__badge">à rattacher</span>
    </span>
  );
}

interface PersonSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  /** Facultatif : une option « Non précisé » permet de laisser vide. */
  optional?: boolean;
  placeholder?: string;
}

/**
 * Choix d'une personne parmi les ressources actives du référentiel (une ressource archivée reste
 * proposée si elle est déjà désignée). Une valeur saisie avant le référentiel apparaît « à
 * rattacher » : l'enregistrement exige d'en choisir une.
 */
export function PersonSelect({ value, onChange, optional = false, placeholder = 'Choisir une ressource…' }: PersonSelectProps) {
  const { resources, byId } = usePeople();
  const unlinked = value && !byId.has(value) ? value : null;
  const options = resources.filter((resource) => resource.active || resource.id === value);

  return (
    <select
      className={`form-input${unlinked ? ' form-input--invalid' : ''}`}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
      required={!optional}
    >
      <option value="" disabled={!optional}>
        {optional ? 'Non précisé' : placeholder}
      </option>
      {unlinked && (
        <option value={unlinked} disabled>
          « {unlinked} » — à rattacher
        </option>
      )}
      {options.map((resource) => (
        <option key={resource.id} value={resource.id}>
          {[resource.name, resource.jobTitle].filter(Boolean).join(' · ')}
          {resource.active ? '' : ' (archivée)'}
        </option>
      ))}
    </select>
  );
}
