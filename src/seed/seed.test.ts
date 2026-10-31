import { DEMO_SEED } from '.';
import raw from './demoSeed.json';

const strings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value !== null && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => [key, ...strings(item)]);
  return [];
};

describe('demo seed', () => {
  it('has exactly one user per role with unique IDs', () => {
    const users = Object.values(DEMO_SEED.users);
    expect(Object.keys(DEMO_SEED.users).sort()).toEqual(['doctor', 'ops', 'patient', 'pharmacist']);
    expect(new Set(users.map((user) => user.id)).size).toBe(4);
  });
  it('has one routine, one urgent, one unclear and one historical scenario', () => {
    expect(DEMO_SEED.scenarios.map((scenario) => scenario.kind).sort()).toEqual(['historical', 'routine', 'unclear', 'urgent']);
    expect(new Set(DEMO_SEED.scenarios.map((scenario) => scenario.episodeId)).size).toBe(4);
  });
  it('contains no dosage wording or real medication names', () => {
    const deny = ['paracetamol', 'ibuprofen', 'amoxicillin', 'cetirizine', 'azithromycin', 'metformin', 'omeprazole', 'dolo', 'crocin'];
    for (const text of strings(raw)) {
      expect(text, text).not.toMatch(/\b\d+\s?(mg|ml|mcg|g)\b/i);
      expect(text, text).not.toMatch(/\b(tablet|capsule|dose|dosage|twice daily|once daily|syrup)\b/i);
      for (const name of deny) expect(text.toLowerCase(), text).not.toContain(name);
    }
  });
  it('labels every user identity as demo or sample', () => {
    for (const user of Object.values(DEMO_SEED.users)) expect(user.displayName).toMatch(/\((demo|sample)\)/);
    expect(DEMO_SEED.users.patient.address.isFictional).toBe(true);
  });
});
