export const formatINR = (amountPaise: number): string => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
}).format(amountPaise / 100);
