import { Inbox } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppState } from '../../app/store';
import { formatDateTime } from '../../lib/time';
import { selectDoctorQueue, type DoctorQueueTab } from '../../review/doctorQueue';
import { EmptyState, PageHeader, SimulatedTag, StatusChip, Tabs, Toast } from '../components/ui';
import { CATEGORY_META } from '../components/categoryMeta';

const TABS: { id: DoctorQueueTab; label: string; empty: string }[] = [
  { id: 'pending', label: 'Pending', empty: 'No cases are waiting for review.' },
  { id: 'in_review', label: 'In review', empty: 'No cases are in review.' },
  { id: 'escalated', label: 'Escalated', empty: 'No escalated cases.' },
  { id: 'completed', label: 'Completed', empty: 'No completed reviews yet.' },
];

export const DoctorQueuePage = () => {
  const state = useAppState();
  const location = useLocation();
  const [tab, setTab] = useState<DoctorQueueTab>('pending');
  const rows = selectDoctorQueue(state, tab);
  const toast = (location.state as { toast?: string } | null)?.toast ?? null;
  return (
    <div className="page">
      <PageHeader eyebrow="Clinical review" title="Doctor review queue" description="Review patient-entered intake and the simulated preliminary summary, then record a simulated workflow decision." meta={<SimulatedTag>Sample / demo patients</SimulatedTag>} />
      <Tabs label="Doctor queue" tabs={TABS.map((item) => ({ id: item.id, label: item.label, count: selectDoctorQueue(state, item.id).length }))} value={tab} onChange={setTab}>
        {rows.length === 0 ? (
          <EmptyState title="Nothing here" icon={Inbox} headingLevel={2}>{TABS.find((item) => item.id === tab)!.empty}</EmptyState>
        ) : (
          <ul className="queue">
            {rows.map(({ episode, concernLabel, markers }) => {
              const category = episode.assessment ? CATEGORY_META[episode.assessment.category] : null;
              return (
                <li key={episode.id} className="queue__row card">
                  <div className="queue__main">
                    <strong>{state.patient.displayName}</strong>
                    <span>{concernLabel}</span>
                    {category && <span className="category"><category.icon size={16} aria-hidden="true" />{category.label} <SimulatedTag>Simulated category</SimulatedTag></span>}
                    <small>Submitted: {episode.intake.submittedAt ? <time dateTime={episode.intake.submittedAt}>{formatDateTime(episode.intake.submittedAt)}</time> : 'Not submitted'}</small>
                  </div>
                  <div className="queue__meta">
                    <StatusChip status={episode.status} />
                    {markers.map((marker) => <span key={marker} className="marker">{marker}</span>)}
                    <Link className="button button--secondary" to={`/doctor/cases/${episode.id}`}>Open case<span className="visually-hidden"> for {concernLabel}, {episode.id}</span></Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Tabs>
      <Toast message={toast} />
    </div>
  );
};
