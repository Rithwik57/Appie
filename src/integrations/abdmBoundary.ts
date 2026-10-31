import { MOCK_BOUNDARY_NOTICE } from '../domain/copy';
import type { AbdmBoundary, BoundaryInfo } from './types';

export const ABDM_BOUNDARY: AbdmBoundary & BoundaryInfo = { name: 'ABDM health records', status: 'not_connected', note: MOCK_BOUNDARY_NOTICE };
