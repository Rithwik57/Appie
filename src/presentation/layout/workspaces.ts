import { ClipboardCheck, HeartPulse, Stethoscope, Truck, type LucideIcon } from 'lucide-react';
import { ROLE_HOME } from '../../app/roleContext';
import { ROLE_LABELS } from '../../domain/copy';
import type { Role } from '../../domain/types';

export interface WorkspaceNavItem { to: string; label: string; end?: boolean; }
export interface WorkspaceConfig {
  role: Role;
  label: string;
  workspaceLabel: string;
  home: string;
  icon: LucideIcon;
  accentClass: string;
  destination: string;
  nav: WorkspaceNavItem[];
}

export const ROLE_ORDER: readonly Role[] = ['patient', 'doctor', 'pharmacist', 'ops'];

export const WORKSPACES: Record<Role, WorkspaceConfig> = {
  patient: {
    role: 'patient',
    label: ROLE_LABELS.patient,
    workspaceLabel: 'Patient workspace',
    home: ROLE_HOME.patient,
    icon: HeartPulse,
    accentClass: 'ws--patient',
    destination: 'Patient dashboard',
    nav: [
      { to: '/patient', label: 'Dashboard', end: true },
      { to: '/patient/intake', label: 'Start health check' },
      { to: '/patient/records', label: 'Records' },
      { to: '/patient/help', label: 'Get human help' },
    ],
  },
  doctor: {
    role: 'doctor',
    label: ROLE_LABELS.doctor,
    workspaceLabel: 'Doctor workspace',
    home: ROLE_HOME.doctor,
    icon: Stethoscope,
    accentClass: 'ws--doctor',
    destination: 'Doctor review queue',
    nav: [{ to: '/doctor', label: 'Review queue' }],
  },
  pharmacist: {
    role: 'pharmacist',
    label: ROLE_LABELS.pharmacist,
    workspaceLabel: 'Pharmacist workspace',
    home: ROLE_HOME.pharmacist,
    icon: ClipboardCheck,
    accentClass: 'ws--pharmacist',
    destination: 'Pharmacist check queue',
    nav: [{ to: '/pharmacist', label: 'Check queue' }],
  },
  ops: {
    role: 'ops',
    label: ROLE_LABELS.ops,
    workspaceLabel: 'Fulfillment / Delivery Operations workspace',
    home: ROLE_HOME.ops,
    icon: Truck,
    accentClass: 'ws--ops',
    destination: 'Fulfillment and delivery queue',
    nav: [{ to: '/operations', label: 'Fulfillment queue' }],
  },
};
