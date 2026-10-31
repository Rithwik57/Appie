import { ArrowRight, CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { isFulfillmentEligible, selectEpisodeByOrderId, selectFulfillmentAudit } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { DELIVERY_STATUS_LABELS } from '../../domain/copy';
import type { DeliveryStatus } from '../../domain/types';
import { formatINR } from '../../lib/money';
import { formatDateTime } from '../../lib/time';
import { nextFulfillmentStatus } from '../../review/operationsQueue';
import { AuditList, BlockedNotice, Button, DataList, DeliveryChip, EmptyState, ErrorSummary, LinkButton, Notice, OrderStatusTracker, PageHeader, Section, SimulatedTag, Toast } from '../components/ui';

const ACTION_LABELS: Record<DeliveryStatus, string> = {
  order_placed: 'Mark as received',
  preparing: 'Mark as preparing',
  dispatched: 'Mark as dispatched',
  out_for_delivery: 'Mark as out for delivery',
  delivered: 'Mark as delivered',
};

export const OperationsOrderPage = () => {
  const { orderId } = useParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const episode = orderId ? selectEpisodeByOrderId(state, orderId) : null;
  const back = <LinkButton variant="secondary" to="/operations">Back to fulfillment queue</LinkButton>;
  if (!episode || !episode.order || !episode.tracking) return <EmptyState title="Order unavailable" action={back}>No simulated order with this ID exists in the local demo data.</EmptyState>;
  if (!isFulfillmentEligible(episode)) return <BlockedNotice title="Order not eligible" action={back}>This order has not passed the doctor, pharmacist and payment checks.</BlockedNotice>;
  const { order, tracking } = episode;
  const next = nextFulfillmentStatus(tracking.current);
  const advance = () => {
    if (next === null) return;
    const result = dispatch({ type: 'ADVANCE_FULFILLMENT', episodeId: episode.id, to: next });
    if (result.ok) {
      setError(null);
      setMessage(`Status updated to ${DELIVERY_STATUS_LABELS[next]} (simulated).`);
    } else {
      setMessage(null);
      setError(result.error.message);
    }
  };
  const address = state.patient.address;
  return (
    <div className="page">
      <PageHeader eyebrow="Fulfillment order" title={`Order ${order.id}`} description={`Placed ${formatDateTime(order.placedAt)}`} meta={<><DeliveryChip status={tracking.current} /><SimulatedTag>Fictional order</SimulatedTag></>} actions={<LinkButton variant="ghost" to="/operations">Back to fulfillment queue</LinkButton>} />
      <ErrorSummary message={error} />
      <Section title="Fulfillment status">
        <OrderStatusTracker tracking={tracking} />
        {next ? (
          <div className="actions"><Button icon={ArrowRight} onClick={advance}>{ACTION_LABELS[next]}</Button></div>
        ) : (
          <Notice tone="success" icon={CircleCheck} title="Delivered (simulated). No further updates." headingLevel={3}><p>The patient sees the same status on their order page.</p></Notice>
        )}
        <p className="hint">Operations can update fulfillment status only. It cannot diagnose, change care guidance or approve prescriptions.</p>
      </Section>
      <div className="grid grid--two">
        <Section title="Order details" actions={<SimulatedTag>Demo prices</SimulatedTag>}>
          <ul className="list">
            {order.lines.map((line) => <li key={line.label} className="list__row"><span>{line.label}</span><span>{formatINR(line.amountPaise)}</span></li>)}
            <li className="list__row list__row--total"><strong>Total</strong><strong>{formatINR(order.totalPaise)}</strong></li>
          </ul>
          <DataList items={[
            { label: 'Payment', value: `${order.paymentMethod.toUpperCase()} · ${order.paymentRef} (simulated)` },
            { label: 'Pharmacy partner', value: order.pharmacyPartner },
            { label: 'Delivery partner', value: order.deliveryPartner },
            { label: 'Delivery estimate', value: order.deliveryEstimate },
            { label: 'Delivery address', value: `${address.line1}, ${address.area}, ${address.city} ${address.pin} (fictional)` },
          ]} />
        </Section>
        <Section title="Tracking history">
          <ol className="audit">
            {[...tracking.events].reverse().map((event) => (
              <li key={`${event.status}-${event.at}`} className="audit__item">
                <div className="audit__head"><strong>{DELIVERY_STATUS_LABELS[event.status]} (simulated)</strong><time dateTime={event.at}>{formatDateTime(event.at)}</time></div>
              </li>
            ))}
          </ol>
        </Section>
      </div>
      <AuditList audit={selectFulfillmentAudit(state, episode.id)} title="Fulfillment audit history" />
      <Toast message={message} />
    </div>
  );
};
