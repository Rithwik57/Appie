import { CreditCard, MapPin, Package, Smartphone, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCheckoutQuote, selectReviewer } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { SIMULATED_PRESCRIPTION_NOTICE } from '../../domain/copy';
import type { DemoPatient, PaymentMethod } from '../../domain/types';
import { formatINR } from '../../lib/money';
import { canCheckout, canTrack, canViewPrescription } from '../../review/gates';
import { BlockedNotice, Button, DataList, LinkButton, MockBoundaryNote, Notice, PageHeader, QuickReplyGroup, ReviewerCard, Section, SimulatedTag, StatusChip } from '../components/ui';
import { useEpisodeFromParams } from './hooks';

const paused = 'Routine Appie flow is paused.';

export const AddressBlock = ({ address }: { address: DemoPatient['address'] }) => (
  <address className="address">
    <MapPin size={18} aria-hidden="true" />
    <span>{address.line1}, {address.area}, {address.city} {address.pin} <SimulatedTag>Fictional demo address</SimulatedTag></span>
  </address>
);

export const PrescriptionSummaryPage = () => {
  const episode = useEpisodeFromParams();
  const state = useAppState();
  if (!episode || !canViewPrescription(episode)) return <BlockedNotice>{episode?.status === 'escalated_urgent' ? `${paused} Prescription and checkout are unavailable for this episode.` : undefined}</BlockedNotice>;
  const doctor = selectReviewer(state, episode.prescription!.approvedBy);
  const pharmacist = selectReviewer(state, episode.pharmacistChecks.at(-1)?.reviewerId ?? null);
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Simulated care plan" title="Simulated prescription and order summary" meta={<StatusChip status={episode.status} />} />
      <Notice tone="urgent" title="Not a valid prescription" headingLevel={2}><p>{SIMULATED_PRESCRIPTION_NOTICE}</p></Notice>
      <Section title="Placeholder items">
        <ul className="list">
          {episode.prescription!.items.map((item) => <li key={item.label} className="list__row"><span>{item.label}</span><small>{item.instructionsPlaceholder}</small></li>)}
        </ul>
      </Section>
      <Section title="Reviewers">
        <div className="stack stack--tight">
          <ReviewerCard reviewer={doctor} />
          {pharmacist ? <ReviewerCard reviewer={pharmacist} /> : <p className="muted">Pending sample pharmacist check.</p>}
        </div>
      </Section>
      <div className="actions">
        {canCheckout(episode) && <LinkButton to={`/patient/episodes/${episode.id}/checkout`}>Continue to simulated checkout</LinkButton>}
        {canTrack(episode) && episode.order && <LinkButton variant="secondary" to={`/patient/orders/${episode.order.id}`}>Track simulated delivery</LinkButton>}
      </div>
    </div>
  );
};

export const CheckoutPage = () => {
  const episode = useEpisodeFromParams();
  const state = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!episode || !canCheckout(episode)) return <BlockedNotice>{episode?.status === 'escalated_urgent' ? `${paused} Checkout is unavailable for this episode.` : 'Checkout is available only after doctor approval and pharmacist confirmation.'}</BlockedNotice>;
  const quote = selectCheckoutQuote();
  const pay = () => {
    const result = dispatch({ type: 'PAY', episodeId: episode.id, method });
    if (result.ok) navigate(`/patient/episodes/${episode.id}/confirmation`);
    else setError(result.error.fieldErrors?.method ?? result.error.message);
  };
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Simulated checkout" title="Simulated checkout" description="No real payment is made. Prices, partners and delivery estimates are fictional." />
      <Section title="Delivery address"><AddressBlock address={state.patient.address} /></Section>
      <Section title="Example order" actions={<SimulatedTag>Demo prices</SimulatedTag>}>
        <ul className="list">
          {quote.lines.map((line) => <li key={line.label} className="list__row"><span>{line.label}</span><span>{formatINR(line.amountPaise)}</span></li>)}
          <li className="list__row list__row--total"><strong>Total</strong><strong>{formatINR(quote.totalPaise)}</strong></li>
        </ul>
        <DataList items={[{ label: 'Pharmacy partner', value: quote.pharmacyPartner }, { label: 'Delivery partner', value: quote.deliveryPartner }, { label: 'Delivery estimate', value: quote.deliveryEstimate }]} />
      </Section>
      <Section title="Payment method">
        <QuickReplyGroup
          legend="Select a simulated payment method"
          options={[
            { value: 'upi', label: 'UPI (simulated)', icon: Smartphone },
            { value: 'card', label: 'Card (simulated)', icon: CreditCard },
            { value: 'wallet', label: 'Wallet (simulated)', icon: Wallet },
          ]}
          value={method}
          onChange={(value) => { setMethod(value as PaymentMethod); setError(null); }}
          error={error ?? undefined}
        />
        <div className="actions"><Button onClick={pay}>Pay (simulated)</Button></div>
      </Section>
      <MockBoundaryNote name="Payment provider" />
    </div>
  );
};

export const ConfirmationPage = () => {
  const episode = useEpisodeFromParams();
  if (!episode || !canTrack(episode)) return <BlockedNotice>{episode?.status === 'escalated_urgent' ? `${paused} Simulated payment, order confirmation, and delivery are unavailable for this episode.` : 'Order confirmation becomes available only after a simulated payment.'}</BlockedNotice>;
  const order = episode.order!;
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Payment complete (simulated)" title="Simulated order confirmed" />
      <Notice tone="success" title="Your simulated payment went through" headingLevel={2}>
        <p>No money was involved. The sample pharmacy partner has received the order and Fulfillment / Delivery Operations will update its status.</p>
      </Notice>
      <Section title="Order details">
        <DataList items={[
          { label: 'Fictional order ID', value: order.id },
          { label: 'Payment', value: <>{order.paymentMethod.toUpperCase()} · {order.paymentRef} <SimulatedTag>Simulated payment</SimulatedTag></> },
          { label: 'Delivery estimate', value: order.deliveryEstimate },
        ]} />
        <div className="actions">
          <LinkButton icon={Package} to={`/patient/orders/${order.id}`}>Track your order</LinkButton>
          <LinkButton variant="secondary" to={`/patient/records/${episode.id}`}>View health record</LinkButton>
        </div>
      </Section>
    </div>
  );
};
