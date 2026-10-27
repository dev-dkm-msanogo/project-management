import { useResourceDirectory } from '@/hooks/useAdministration';

/**
 * Suggestions de saisie tirées du référentiel des ressources (ressources actives) : la saisie
 * reste libre, mais les noms de l'organisation sont proposés et orthographiés à l'identique.
 */
export function ResourceSuggestions({ id, extra = [] }: { id: string; extra?: readonly string[] }) {
  const { data } = useResourceDirectory();
  const active = (data?.resources ?? []).filter((resource) => resource.active);
  const known = new Set(active.map((resource) => resource.name.toLowerCase()));

  return (
    <datalist id={id}>
      {active.map((resource) => (
        <option key={resource.id} value={resource.name}>
          {[resource.jobTitle, resource.department].filter(Boolean).join(' · ')}
        </option>
      ))}
      {extra
        .filter((name) => !known.has(name.toLowerCase()))
        .map((name) => (
          <option key={name} value={name} />
        ))}
    </datalist>
  );
}
