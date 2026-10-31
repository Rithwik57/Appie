import { Inbox } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { selectReviewer } from '../../app/selectors';
import { useAppState } from '../../app/store';
import { selectPharmacistQueue, type PharmacistQueueTab } from '../../review/pharmacistQueue';
import { EmptyState, PageHeader, SimulatedTag, StatusChip, Tabs, Toast } from '../components/ui';

const TABS: { id: PharmacistQueueTab; label: string; empty: string }[] = [
  { id: 'awaiting', label: 'Awaiting check', empty: 'No doctor-approved items are waiting for a check. Items appear here only after a sample doctor approves a simulated care plan.' },
  { id: 'flagged', label: 'Flagged to doctor', empty: 'No items are flagged back to the doctor.' },
  { id: 'completed', label: 'Completed', empty: 'No completed checks yet.' },
];

export const PharmacistQueuePage = () => {
  const state = useAppState();
  const location = useLocation();
  const [tab, setTab] = useState<PharmacistQueueTab>('awaiting');
  const rows = selectPharmacistQueue(state, tab);
  const toast = (location.state as { toast?: string } | null)?.toast ?? null;
  return (
    <div className="page">
      <PageHeader eyebrow="Pharmacy" title="Pharmacist check queue" description="Only doctor-approved simulated items awaiting a medication and fulfillment check appear here." meta={<SimulatedTag>Demo fulfillment workflow</SimulatedTag>} />
      <Tabs label="Pharmacist queue" tabs={TABS.map((item) => ({ id: item.id, label: item.label, count: selectPharmacistQueue(state, item.id).length }))} value={tab} onChange={setTab}>
        {rows.length === 0 ? (
          <EmptyState title="Nothing here" icon={Inbox} headingLevel={2}>{TABS.find((item) => item.id === tab)!.empty}</EmptyState>
        ) : (
          <ul className="queue">
            {rows.map(({ episode, concernLabel, marker, approvingDoctorId }) => (
              <li key={episode.id} className="queue__row card">
                <div className="queue__main">
                  <strong>{state.patient.displayName}</strong>
                  <span>{concernLabel}</span>
                  <small>{episode.prescription!.id} · approved by {selectReviewer(state, approvingDoctorId)?.displayName ?? 'sample doctor'}</small>
                </div>
                <div className="queue__meta">
                  <StatusChip status={episode.status} />
                  <span className="marker">{marker}</span>
                  <Link className="button button--secondary" to={`/pharmacist/checks/${episode.id}`}>Open check<span className="visually-hidden"> for {episode.prescription!.id}</span></Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tabs>
      <Toast message={toast} />
    </div>
  );
};
