import type { Role } from '../domain/types';
export const ROLE_HOME: Record<Role, string> = { patient: '/patient', doctor: '/doctor', pharmacist: '/pharmacist', ops: '/operations' };
