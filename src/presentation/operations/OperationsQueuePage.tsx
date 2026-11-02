import { Inbox } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../../app/store';
import { formatINR } from '../../lib/money';
import { formatDateTime } from '../../lib/time';
import { selectOperationsQueue, type OperationsQueueTab } from '../../review/operationsQueue';
import { DeliveryChip, EmptyState, PageHeader, SimulatedTag, Tabs } from '../components/ui';

const TABS: { id: OperationsQueueTab; label: string; empty: string }[] = [
  { id: 'active', label: 'Active', empty: 'No paid orders are currently in fulfillment. Orders appear here after the doctor, pharmacist and simulated payment checks are complete.' },
  { id: 'delivered', label: 'Delivered', empty: 'No orders have been delivered in this demo yet.' },
];

export const OperationsQueuePage = () => {
  const state = useAppState();
  const [tab, setTab] = useState<OperationsQueueTab>('active');
  const rows = selectOperationsQueue(state, tab);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Fulfillment operations"
        title="Fulfillment and delivery queue"
        description="Track fictional orders that passed the doctor, pharmacist and simulated payment steps."
        meta={<SimulatedTag>Demo fulfillment workflow</SimulatedTag>}
      />
      <Tabs
        label="Fulfillment queue"
        tabs={TABS.map((item) => ({ id: item.id, label: item.label, count: selectOperationsQueue(state, item.id).length }))}
        value={tab}
        onChange={setTab}
      >
        {rows.length === 0 ? (
          <EmptyState title="Nothing here" icon={Inbox} headingLevel={2}>
            {TABS.find((item) => item.id === tab)!.empty}
          </EmptyState>
        ) : (
          <ul className="queue">
            {rows.map(({ order, tracking }) => (
              <li key={order.id} className="queue__row card">
                <div className="queue__main">
                  <strong>{state.patient.displayName}</strong>
                  <span>Order {order.id}</span>
                  <small>Placed <time dateTime={order.placedAt}>{formatDateTime(order.placedAt)}</time> · {order.lines.length} demo item{order.lines.length === 1 ? '' : 's'} · {formatINR(order.totalPaise)}</small>
                </div>
                <div className="queue__meta">
                  <DeliveryChip status={tracking.current} />
                  <SimulatedTag>Fictional order</SimulatedTag>
                  <Link className="button button--secondary" to={`/operations/orders/${order.id}`}>
                    Open order <span className="visually-hidden">{order.id}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tabs>
    </div>
  );
};
