import { Info } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { selectAuditFor, selectEpisodeByOrderId } from '../../app/selectors';
import { useAppState } from '../../app/store';
import { DELIVERY_STATUS_LABELS } from '../../domain/copy';
import { formatINR } from '../../lib/money';
import { formatDateTime } from '../../lib/time';
import { canTrack } from '../../review/gates';
import { BlockedNotice, DataList, DeliveryChip, EmptyState, LinkButton, Notice, OrderStatusTracker, PageHeader, Section, SimulatedTag } from '../components/ui';
import { AddressBlock } from './CheckoutPages';
import { useEpisodeFromParams } from './hooks';

/** Legacy `/patient/episodes/:episodeId/tracking` → the order page. */
export const TrackingRedirect = () => {
  const episode = useEpisodeFromParams();
  if (episode && canTrack(episode) && episode.order) return <Navigate replace to={`/patient/orders/${episode.order.id}`} />;
  return <BlockedNotice>{episode?.status === 'escalated_urgent' ? 'Routine Appie flow is paused. Delivery tracking is unavailable.' : 'Tracking is available after simulated payment.'}</BlockedNotice>;
};

/** Read-only patient view of the same order that Operations updates. */
export const PatientOrderPage = () => {
  const { orderId } = useParams();
  const state = useAppState();
  const episode = orderId ? selectEpisodeByOrderId(state, orderId) : null;
  if (!episode || !episode.order || !episode.tracking) return <EmptyState title="Order unavailable" action={<LinkButton to="/patient">Back to dashboard</LinkButton>}>No simulated order with this ID exists in the local demo data.</EmptyState>;
  if (!canTrack(episode)) return <BlockedNotice>Routine Appie flow is paused. Delivery tracking is unavailable.</BlockedNotice>;
  const { order, tracking } = episode;
  const updates = selectAuditFor(state, episode.id).filter((entry) => entry.action === 'delivery_status_changed');
  return (
    <div className="page">
      <PageHeader eyebrow="Order tracking" title={`Order ${order.id}`} description={`Placed ${formatDateTime(order.placedAt)}`} meta={<><DeliveryChip status={tracking.current} /><SimulatedTag>Fictional order</SimulatedTag></>} />
      <Section title="Progress"><OrderStatusTracker tracking={tracking} /></Section>
      <Notice tone="neutral" icon={Info} headingLevel={2}>
        <p>Status updates come from the Fulfillment / Delivery Operations workspace (simulated). You cannot change them here.</p>
      </Notice>
      <div className="grid grid--two">
        <Section title="Tracking history">
          <ol className="audit">
            {[...tracking.events].reverse().map((event) => {
              const update = updates.find((entry) => entry.detail.includes(DELIVERY_STATUS_LABELS[event.status]) && entry.at === event.at);
              return (
                <li key={`${event.status}-${event.at}`} className="audit__item">
                  <div className="audit__head"><strong>{DELIVERY_STATUS_LABELS[event.status]} (simulated)</strong><time dateTime={event.at}>{formatDateTime(event.at)}</time></div>
                  <p className="audit__meta">{update ? `Updated by ${update.actorName} (Fulfillment operations, demo)` : 'Order received by the sample pharmacy partner'}</p>
                </li>
              );
            })}
          </ol>
        </Section>
        <Section title="Order details" actions={<SimulatedTag>Demo prices</SimulatedTag>}>
          <ul className="list">
            {order.lines.map((line) => <li key={line.label} className="list__row"><span>{line.label}</span><span>{formatINR(line.amountPaise)}</span></li>)}
            <li className="list__row list__row--total"><strong>Total</strong><strong>{formatINR(order.totalPaise)}</strong></li>
          </ul>
          <DataList items={[
            { label: 'Pharmacy partner', value: order.pharmacyPartner },
            { label: 'Delivery partner', value: order.deliveryPartner },
            { label: 'Delivery estimate', value: order.deliveryEstimate },
            { label: 'Payment', value: `${order.paymentMethod.toUpperCase()} (simulated)` },
          ]} />
          <AddressBlock address={state.patient.address} />
        </Section>
      </div>
      <div className="actions">
        <LinkButton variant="secondary" to={`/patient/episodes/${episode.id}`}>View episode</LinkButton>
        <LinkButton variant="ghost" to={`/patient/records/${episode.id}`}>View record</LinkButton>
      </div>
    </div>
  );
};
