import { CircleCheck, CircleHelp, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { AssessmentCategory } from '../../domain/types';

/** Simulated triage category label + icon, shared by patient and doctor views. */
export const CATEGORY_META: Record<AssessmentCategory, { label: string; icon: LucideIcon }> = {
  looks_routine: { label: 'Looks routine', icon: CircleCheck },
  needs_human_input: { label: 'Needs more human input', icon: CircleHelp },
  possibly_urgent: { label: 'Possibly urgent', icon: TriangleAlert },
};
