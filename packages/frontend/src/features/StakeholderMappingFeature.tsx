import type { StakeholderDto } from '@shared/index';
import { stakeholderMappingApi } from '@/api/project-documents';
import { StakeholderMappingEditor } from '@/components/stakeholders/StakeholderMappingEditor';
import { StakeholderMappingView } from '@/components/stakeholders/StakeholderMappingView';
import { SummaryTiles } from '@/components/ui/SummaryTiles';
import { DocumentFeature } from '@/features/DocumentFeature';
import { useStakeholderMapping, useStakeholderRegister } from '@/hooks/useProjectDocuments';
import { blankMapping, mappingDtoToInput } from '@/lib/stakeholder-tools-format';
import type { AppView } from '@/navigation/pmp';

interface StakeholderToolFeatureProps {
  projectId: string;
  onNavigate: (view: AppView) => void;
}

/** Du plus influent au moins influent (comme le plan d'engagement). */
const byInfluence = (a: StakeholderDto, b: StakeholderDto) =>
  b.power + b.interest - (a.power + a.interest) || a.code.localeCompare(b.code);

/** Page « Cartographie des parties prenantes » : saillance, directions d'influence, pouvoir / intérêt. */
export function StakeholderMappingFeature({ projectId, onNavigate }: StakeholderToolFeatureProps) {
  const resource = useStakeholderMapping(projectId);
  const { data: register } = useStakeholderRegister(projectId);
  const stakeholders = [...(register?.stakeholders ?? [])].sort(byInfluence);

  return (
    <DocumentFeature
      projectId={projectId}
      history={stakeholderMappingApi}
      deletion={{
        title: 'Supprimer la cartographie des parties prenantes ?',
        run: () => stakeholderMappingApi.remove(projectId),
      }}
      resource={resource}
      toInput={mappingDtoToInput}
      blank={() => blankMapping(stakeholders)}
      labels={{
        edit: 'Éditer la cartographie',
        create: '+ Établir la cartographie',
        loading: 'Chargement de la cartographie…',
        emptyTitle: "La cartographie des parties prenantes n'a pas encore été établie",
        emptyText:
          stakeholders.length > 0
            ? `Elle part des ${stakeholders.length} parties prenantes du registre : indiquez pour chacune son urgence, sa légitimité et la direction de son influence.`
            : "Identifiez d'abord les parties prenantes dans leur registre : la cartographie s'appuie sur leur pouvoir.",
      }}
      renderView={(mapping) => (
        <article className="doc-page">
          <SummaryTiles
            tiles={[
              { label: 'Définitives', value: mapping.entries.filter((entry) => entry.category === 'DEFINITIVE').length, tone: 'danger' },
              {
                label: 'Dominantes ou dépendantes',
                value: mapping.entries.filter((entry) => entry.category === 'DOMINANT' || entry.category === 'DEPENDENT').length,
              },
              { label: 'Dangereuses', value: mapping.entries.filter((entry) => entry.category === 'DANGEROUS').length, tone: 'warning' },
              { label: 'Non cartographiées', value: mapping.unmapped.length, tone: 'alert' },
            ]}
          />
          <StakeholderMappingView mapping={mapping} onNavigate={onNavigate} />
        </article>
      )}
      renderEditor={(props) => <StakeholderMappingEditor projectId={projectId} stakeholders={stakeholders} {...props} />}
    />
  );
}
