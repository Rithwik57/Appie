export const now = (): string => new Date().toISOString();

export const formatDateTime = (timestamp: string): string => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(timestamp));
