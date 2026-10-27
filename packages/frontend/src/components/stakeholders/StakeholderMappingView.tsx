import { useState } from 'react';
import type { StakeholderMappingDto } from '@shared/index';
import { InfluenceDirections } from '@/components/stakeholders/InfluenceDirections';
import { PowerInterestGrid } from '@/components/stakeholders/PowerInterestGrid';
import { SalienceModel } from '@/components/stakeholders/SalienceModel';
import { Tabs } from '@/components/ui/Tabs';
import { formatLongDate } from '@/lib/format';
import type { AppView } from '@/navigation/pmp';

type Tab = 'salience' | 'directions' | 'grid';

interface StakeholderMappingViewProps {
  mapping: StakeholderMappingDto;
  onNavigate: (view: AppView) => void;
}

/** Cartographie : modèle de saillance, directions d'influence et grille pouvoir / intérêt du registre. */
export function StakeholderMappingView({ mapping, onNavigate }: StakeholderMappingViewProps) {
  const [tab, setTab] = useState<Tab>('salience');

  return (
    <>
      <p className="doc-status">
        {mapping.unmapped.length > 0
          ? `Établie le ${formatLongDate(mapping.preparedOn)}. Pas encore cartographiée(s) : ${mapping.unmapped.join(', ')}.`
          : `Établie le ${formatLongDate(mapping.preparedOn)} ; toutes les parties prenantes du registre sont cartographiées.`}{' '}
        <button type="button" className="ref-link" onClick={() => onNavigate('stakeholders')}>
          Pouvoir et intérêt : registre des parties prenantes →
        </button>
      </p>

      <Tabs
        label="Cartographie"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'salience', label: 'Modèle de saillance' },
          { id: 'directions', label: "Directions d'influence" },
          { id: 'grid', label: 'Pouvoir / intérêt' },
        ]}
      >
        <section className="doc-panel">
          {tab === 'salience' && <SalienceModel entries={mapping.entries} />}
          {tab === 'directions' && <InfluenceDirections entries={mapping.entries} />}
          {tab === 'grid' && <PowerInterestGrid stakeholders={mapping.stakeholders} />}
        </section>
      </Tabs>
    </>
  );
}
