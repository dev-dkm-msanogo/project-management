export interface TextSection {
  key: string;
  label: string;
  text: string;
  /** Ce que la section doit couvrir, affiché tant qu'elle n'est pas rédigée. */
  hint?: string;
}

/** Rubriques rédigées d'un document (plan, synthèse…) : intitulé puis texte, ou « À rédiger ». */
export function TextSections({ sections }: { sections: readonly TextSection[] }) {
  return (
    <div className="plan-sections">
      {sections.map((section) => (
        <section key={section.key} className="plan-sections__item">
          <h3 className="doc-subtitle">{section.label}</h3>
          {section.text ? (
            <p className="doc-text">{section.text}</p>
          ) : (
            <p className="plan__empty">{section.hint ? `À rédiger : ${section.hint}` : 'À rédiger.'}</p>
          )}
        </section>
      ))}
    </div>
  );
}

/** Rubriques d'un objet texte, dans l'ordre de ses libellés. */
export function sectionsOf<K extends string>(labels: Record<K, string>, values: Record<K, string>): TextSection[] {
  return (Object.keys(labels) as K[]).map((key) => ({ key, label: labels[key], text: values[key] }));
}
