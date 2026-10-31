import type { AuditAction, AuditEntry, Role } from '../domain/types';
import { nextId } from '../lib/ids';

export const makeAuditEntry = (counters: Readonly<Record<string, number>>, input: { episodeId: string; at: string; actorRole: Role | 'system'; actorName: string; action: AuditAction; detail: string }): { entry: AuditEntry; counters: Record<string, number> } => {
  const issued = nextId(counters, 'aud');
  return { counters: issued.counters, entry: { id: issued.id, ...input } };
};
