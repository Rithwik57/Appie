export interface NextIdResult { id: string; counters: Record<string, number>; }

export const nextId = (counters: Readonly<Record<string, number>>, prefix: string): NextIdResult => {
  const value = (counters[prefix] ?? 0) + 1;
  return { id: `${prefix}-${String(value).padStart(4, '0')}`, counters: { ...counters, [prefix]: value } };
};
