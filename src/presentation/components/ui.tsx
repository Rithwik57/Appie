import { forwardRef, useEffect, useId, useRef } from 'react';
import type { ButtonHTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import {
  Ban,
  Circle,
  CircleCheck,
  CircleDot,
  CircleMinus,
  CirclePause,
  Clock3,
  FlaskConical,
  Info,
  LoaderCircle,
  ShieldAlert,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { AuditEntry, Consent, DeliveryStatus, DeliveryTracking, DemoIdentity, ReviewerIdentity, TimelineStep, TimelineStepState, Tone } from '../../domain/types';
import { ACTOR_ROLE_LABELS, AUDIT_ACTION_LABELS, DELIVERY_STATUS_LABELS, PROTOTYPE_DISCLAIMER, SAMPLE_IDENTITY_LABEL } from '../../domain/copy';
import { DELIVERY_STATUSES, STATUS_META } from '../../domain/status';
import { formatDateTime } from '../../lib/time';
import { WORKSPACES } from '../layout/workspaces';

type HeadingLevel = 1 | 2 | 3;
const Heading = ({ level, children, id, className }: { level: HeadingLevel; children: ReactNode; id?: string; className?: string }) => {
  const Tag = `h${level}` as const;
  return <Tag id={id} className={className}>{children}</Tag>;
};

/* ---------- Surfaces ---------- */

export const Card = ({ children, className = '', labelledBy }: { children: ReactNode; className?: string; labelledBy?: string }) => (
  <section className={`card ${className}`.trim()} aria-labelledby={labelledBy}>
    {children}
  </section>
);

export const PageHeader = ({ eyebrow, title, description, actions, meta }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; meta?: ReactNode }) => (
  <header className="page-header">
    <div className="page-header__text">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-header__description">{description}</p>}
      {meta && <div className="cluster">{meta}</div>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </header>
);

export const Section = ({ title, children, actions, level = 2, className = '' }: { title: ReactNode; children: ReactNode; actions?: ReactNode; level?: 2 | 3; className?: string }) => {
  const id = useId();
  return (
    <section className={`card section ${className}`.trim()} aria-labelledby={id}>
      <div className="section__header">
        <Heading level={level} id={id}>{title}</Heading>
        {actions}
      </div>
      {children}
    </section>
  );
};

export const DataList = ({ items }: { items: ReadonlyArray<{ label: string; value: ReactNode }> }) => (
  <dl className="data-list">
    {items.map((item) => (
      <div className="data-list__row" key={item.label}>
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
      </div>
    ))}
  </dl>
);

/* ---------- Actions ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; icon?: LucideIcon }>(
  ({ children, variant = 'primary', icon: Icon, type = 'button', className = '', ...props }, ref) => (
    <button ref={ref} type={type} className={`button button--${variant} ${className}`.trim()} {...props}>
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export const LinkButton = ({ children, variant = 'primary', icon: Icon, className = '', ...props }: LinkProps & { variant?: Exclude<ButtonVariant, 'danger'>; icon?: LucideIcon }) => (
  <Link className={`button button--${variant} ${className}`.trim()} {...props}>
    {Icon && <Icon size={18} aria-hidden="true" />}
    {children}
  </Link>
);

/* ---------- Labels and status ---------- */

export const SimulatedTag = ({ children = 'Simulated / demo' }: { children?: ReactNode }) => (
  <span className="tag">
    <FlaskConical size={12} aria-hidden="true" />
    {children}
  </span>
);

const TONE_ICON: Record<Tone, LucideIcon> = { info: Info, success: CircleCheck, warning: Clock3, urgent: ShieldAlert, neutral: Circle, blocked: CirclePause };

/** Status is always icon + text, never colour alone. */
export const ToneChip = ({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: LucideIcon }) => {
  const Icon = icon ?? TONE_ICON[tone];
  return (
    <span className={`status status--${tone}`}>
      <Icon size={16} aria-hidden="true" />
      {children}
    </span>
  );
};

export const StatusChip = ({ status }: { status: keyof typeof STATUS_META }) => {
  const meta = STATUS_META[status];
  return <ToneChip tone={meta.tone} icon={status === 'escalated_urgent' ? CirclePause : undefined}>{meta.label}</ToneChip>;
};

export const DeliveryChip = ({ status }: { status: DeliveryStatus }) => (
  <ToneChip tone={status === 'delivered' ? 'success' : 'info'}>{DELIVERY_STATUS_LABELS[status]} (simulated)</ToneChip>
);

export const Notice = ({ tone = 'info', title, children, icon, headingLevel = 2 }: { tone?: Tone; title?: ReactNode; children?: ReactNode; icon?: LucideIcon; headingLevel?: HeadingLevel }) => {
  const Icon = icon ?? (tone === 'urgent' ? ShieldAlert : tone === 'warning' ? TriangleAlert : TONE_ICON[tone]);
  return (
    <div className={`notice notice--${tone}`}>
      <Icon size={22} aria-hidden="true" className="notice__icon" />
      <div className="notice__body">
        {title && <Heading level={headingLevel} className="notice__title">{title}</Heading>}
        {children}
      </div>
    </div>
  );
};

export const ReviewerCard = ({ reviewer }: { reviewer: ReviewerIdentity | null }) =>
  reviewer === null ? null : (
    <div className="reviewer">
      <span className="reviewer__avatar" aria-hidden="true">{reviewer.displayName.replace('Dr. ', '').charAt(0)}</span>
      <div>
        <strong>{reviewer.displayName}</strong>
        <span>{reviewer.credentialLabel}</span>
        <SimulatedTag>{SAMPLE_IDENTITY_LABEL}</SimulatedTag>
      </div>
    </div>
  );

export const IdentityBadge = ({ identity, compact = false }: { identity: DemoIdentity; compact?: boolean }) => {
  const Icon = WORKSPACES[identity.role].icon;
  return (
    <span className={`identity ${compact ? 'identity--compact' : ''}`.trim()}>
      <span className="identity__icon" aria-hidden="true"><Icon size={compact ? 16 : 20} /></span>
      <span className="identity__text">
        <strong>{identity.displayName}</strong>
        {!compact && <small>{identity.detail}</small>}
      </span>
    </span>
  );
};

/* ---------- History ---------- */

export const AuditList = ({ audit, title = 'Audit history', headingLevel = 2, emptyText = 'No audit events recorded yet.' }: { audit: AuditEntry[]; title?: string; headingLevel?: 2 | 3; emptyText?: string }) => {
  const id = useId();
  return (
    <section className="card audit-section" aria-labelledby={id}>
      <div className="section__header">
        <Heading level={headingLevel} id={id}>{title}</Heading>
        <SimulatedTag>Local demo data</SimulatedTag>
      </div>
      {audit.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <ol className="audit">
          {audit.map((entry) => (
            <li key={entry.id} className="audit__item">
              <div className="audit__head">
                <strong>{AUDIT_ACTION_LABELS[entry.action]}</strong>
                <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
              </div>
              <p className="audit__meta">
                <span className="role-pill">{ACTOR_ROLE_LABELS[entry.actorRole]}</span> {entry.actorName}
              </p>
              <p className="audit__detail">{entry.detail}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

const STEP_META: Record<TimelineStepState, { icon: LucideIcon; label: string }> = {
  completed: { icon: CircleCheck, label: 'Completed' },
  active: { icon: CircleDot, label: 'In progress' },
  pending: { icon: Circle, label: 'Pending' },
  blocked: { icon: CirclePause, label: 'Paused' },
  skipped: { icon: CircleMinus, label: 'Not needed' },
};

export const Timeline = ({ steps }: { steps: TimelineStep[] }) => (
  <ol className="timeline">
    {steps.map((step) => {
      const meta = STEP_META[step.state];
      const Icon = meta.icon;
      return (
        <li key={step.key} className={`timeline__item timeline__item--${step.state}`}>
          <span className="timeline__icon" aria-hidden="true"><Icon size={20} /></span>
          <div className="timeline__body">
            <div className="timeline__head">
              <strong>{step.label}</strong>
              <span className="timeline__state">{meta.label}</span>
            </div>
            <p className="timeline__detail">
              {step.party}
              {step.detail ? ` · ${step.detail}` : ''}
            </p>
            {step.at && <small>Updated <time dateTime={step.at}>{formatDateTime(step.at)}</time></small>}
            {step.events && (
              <ol className="timeline__events">
                {step.events.map((event) => (
                  <li key={`${event.at}-${event.detail}`}>
                    {event.detail} · <time dateTime={event.at}>{formatDateTime(event.at)}</time>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </li>
      );
    })}
  </ol>
);

/** The five simulated fulfillment stages with completed / current / upcoming state as icon + text. */
export const OrderStatusTracker = ({ tracking }: { tracking: DeliveryTracking }) => {
  const currentIndex = DELIVERY_STATUSES.indexOf(tracking.current);
  return (
    <ol className="tracker" aria-label="Simulated fulfillment progress">
      {DELIVERY_STATUSES.map((status, index) => {
        const state = index < currentIndex || tracking.current === 'delivered' ? 'completed' : index === currentIndex ? 'current' : 'upcoming';
        const Icon = state === 'completed' ? CircleCheck : state === 'current' ? CircleDot : Circle;
        const event = tracking.events.find((candidate) => candidate.status === status);
        return (
          <li key={status} className={`tracker__step tracker__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <Icon size={20} aria-hidden="true" />
            <span className="tracker__label">{DELIVERY_STATUS_LABELS[status]}</span>
            <span className="tracker__state">{state === 'completed' ? 'Done' : state === 'current' ? 'Current' : 'Upcoming'}</span>
            {event && <time dateTime={event.at}>{formatDateTime(event.at)}</time>}
          </li>
        );
      })}
    </ol>
  );
};

/* ---------- States ---------- */

export const EmptyState = ({ title, children, icon: Icon = Info, headingLevel = 1, action }: { title: string; children: ReactNode; icon?: LucideIcon; headingLevel?: HeadingLevel; action?: ReactNode }) => (
  <div className="card empty-state">
    <span className="empty-state__icon" aria-hidden="true"><Icon size={28} /></span>
    <Heading level={headingLevel}>{title}</Heading>
    <p>{children}</p>
    {action && <div className="actions actions--center">{action}</div>}
  </div>
);

export const BlockedNotice = ({ children = 'This page is unavailable because the required review or simulated payment step has not been completed.', title = 'Routine flow blocked', headingLevel = 1, action }: { children?: ReactNode; title?: string; headingLevel?: HeadingLevel; action?: ReactNode }) => (
  <div className="card blocked">
    <Notice tone="blocked" icon={Ban} title={title} headingLevel={headingLevel}>
      <p>{children}</p>
      {action && <div className="actions">{action}</div>}
    </Notice>
  </div>
);

export const ErrorSummary = ({ message, id }: { message: string | null; id?: string }) =>
  message === null ? null : (
    <p className="error-summary" role="alert" id={id}>
      <TriangleAlert size={18} aria-hidden="true" />
      {message}
    </p>
  );

export const LoadingState = ({ label = 'Loading local demo data…' }: { label?: string }) => (
  <p className="loading" aria-live="polite">
    <LoaderCircle size={18} aria-hidden="true" className="spin" />
    {label}
  </p>
);

export const ConsentSummary = ({ consent }: { consent: Consent | null }) =>
  consent === null ? (
    <p>No demo consent has been recorded.</p>
  ) : (
    <p>
      <strong>Consent {consent.decision}</strong> · <time dateTime={consent.decidedAt}>{formatDateTime(consent.decidedAt)}</time> <SimulatedTag>Demo record</SimulatedTag>
    </p>
  );

export const MockBoundaryNote = ({ name }: { name: string }) => <p className="boundary">{name}: Mock integration boundary – not connected.</p>;

export const ProgressSteps = ({ current, total = 5 }: { current: number; total?: number }) => (
  <div className="progress">
    <p className="progress__label">Step {current} of {total}</p>
    <div className="progress__bar" role="progressbar" aria-label={`Step ${current} of ${total}`} aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
      <span style={{ width: `${(current / total) * 100}%` }} />
    </div>
  </div>
);

export const DisclaimerInline = () => <p className="disclaimer-inline">{PROTOTYPE_DISCLAIMER}</p>;

export const Toast = ({ message }: { message: string | null }) => (
  <div className={`toast ${message ? 'toast--visible' : ''}`.trim()} aria-live="polite" role="status">
    {message && <CircleCheck size={18} aria-hidden="true" />}
    {message}
  </div>
);

export const ConfirmDialog = ({ open, title, children, onCancel, onConfirm, confirmLabel = 'Confirm' }: { open: boolean; title: string; children: ReactNode; onCancel: () => void; onConfirm: () => void; confirmLabel?: string }) => {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);
  useEffect(() => {
    if (!open) return undefined;
    triggerRef.current = document.activeElement;
    cancelRef.current?.focus();
    return () => {
      const trigger = triggerRef.current;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open]);
  if (!open) return null;
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key === 'Tab') {
      const first = cancelRef.current;
      const last = confirmRef.current;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };
  return (
    <div className="dialog-backdrop" role="presentation">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
        <h2 id={titleId}>{title}</h2>
        <p>{children}</p>
        <div className="actions">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button ref={confirmRef} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Tabs (WAI-ARIA tablist with roving tabindex) ---------- */

export interface TabItem<T extends string> { id: T; label: string; count?: number; }
export const Tabs = <T extends string>({ label, tabs, value, onChange, children }: { label: string; tabs: ReadonlyArray<TabItem<T>>; value: T; onChange: (value: T) => void; children: ReactNode }) => {
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === value));
  const move = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next]!.id);
    refs.current[next]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight') move(activeIndex + 1);
    else if (event.key === 'ArrowLeft') move(activeIndex - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(tabs.length - 1);
    else return;
    event.preventDefault();
  };
  return (
    <div className="tabs-wrap">
      <div className="tabs" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => { refs.current[index] = element; }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={tab.id === value}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab.id === value ? 0 : -1}
            className="tab"
            onClick={() => onChange(tab.id)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
            {tab.count !== undefined && <span className="tab__count">{tab.count}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${value}`} className="tabpanel">
        {children}
      </div>
    </div>
  );
};

/* ---------- Form controls ---------- */

export interface ChoiceOption { value: string; label: string; description?: string; icon?: LucideIcon; disabled?: boolean; }
export const QuickReplyGroup = ({ legend, options, value, onChange, error, description }: { legend: string; options: readonly ChoiceOption[]; value: string | null; onChange: (value: string) => void; error?: string; description?: string }) => {
  const errorId = useId();
  const descriptionId = useId();
  const name = useId();
  const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className="choice-group" aria-describedby={describedBy} aria-invalid={error ? true : undefined}>
      <legend>{legend}</legend>
      {description && <p className="hint" id={descriptionId}>{description}</p>}
      <div className="choice-grid">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <label key={option.value} className={`choice ${value === option.value ? 'choice--selected' : ''} ${option.disabled ? 'choice--disabled' : ''}`.trim()}>
              <input type="radio" name={name} value={option.value} checked={value === option.value} disabled={option.disabled} onChange={() => onChange(option.value)} />
              {Icon && <Icon size={20} aria-hidden="true" className="choice__icon" />}
              <span className="choice__text">
                <span className="choice__label">{option.label}</span>
                {option.description && <small>{option.description}</small>}
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="error" id={errorId} role="alert">{error}</p>}
    </fieldset>
  );
};
export const RadioCardGroup = QuickReplyGroup;

export const TextArea = ({ label, value, onChange, error, maxLength = 500, hint, required = false }: { label: string; value: string; onChange: (value: string) => void; error?: string; maxLength?: number; hint?: string; required?: boolean }) => {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="field__required"> (required)</span>}
      </label>
      {hint && <p className="hint" id={hintId}>{hint}</p>}
      <textarea id={id} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} aria-describedby={error ? describedBy : hint ? hintId : undefined} aria-invalid={error ? true : undefined} />
      <span className="field__count" aria-hidden="true">{value.length}/{maxLength}</span>
      {error && <p className="error" id={errorId} role="alert">{error}</p>}
    </div>
  );
};

export const Field = ({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) => {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined} />
      {error && <p className="error" id={errorId} role="alert">{error}</p>}
    </div>
  );
};

export const SelectField = ({ id: providedId, label, value, onChange, options, error, hint }: { id?: string; label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<{ value: string; label: string }>; error?: string | null; hint?: string }) => {
  const generated = useId();
  const id = providedId ?? generated;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <p className="hint" id={hintId}>{hint}</p>}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <p className="error" id={errorId} role="alert">{error}</p>}
    </div>
  );
};

export const ClockIcon = Clock3;
