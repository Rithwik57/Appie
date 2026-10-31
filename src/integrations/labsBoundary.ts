import { MOCK_BOUNDARY_NOTICE } from '../domain/copy';
import type { BoundaryInfo, LabsBoundary } from './types';

export const LABS_BOUNDARY: LabsBoundary & BoundaryInfo = { name: 'Diagnostic labs', status: 'not_connected', note: MOCK_BOUNDARY_NOTICE };
