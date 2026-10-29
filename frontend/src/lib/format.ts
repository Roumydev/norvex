// Formatting helpers and status badge colours shared by every view.

export const formatDZD = (amount: number) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M DZD`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K DZD`;
  return `${amount.toLocaleString()} DZD`;
};

export const formatFullDZD = (amount: number) => `${amount.toLocaleString('fr-DZ')} DZD`;

export const statusColors: Record<string, string> = {
  Available: 'background:#D1FAE5;color:#065F46',
  Reserved: 'background:#FEF3C7;color:#92400E',
  Sold: 'background:#DBEAFE;color:#1E40AF',
  Rented: 'background:#EDE9FE;color:#5B21B6',
  Active: 'background:#D1FAE5;color:#065F46',
  Inactive: 'background:#F3F4F6;color:#374151',
  Pending: 'background:#FEF3C7;color:#92400E',
  Draft: 'background:#F3F4F6;color:#374151',
  Completed: 'background:#DBEAFE;color:#1E40AF',
  Cancelled: 'background:#FEE2E2;color:#991B1B',
  Paid: 'background:#D1FAE5;color:#065F46',
  Overdue: 'background:#FEE2E2;color:#991B1B',
  Scheduled: 'background:#DBEAFE;color:#1E40AF',
  'No-show': 'background:#FEE2E2;color:#991B1B',
  New: 'background:#F3F4F6;color:#374151',
  Contacted: 'background:#DBEAFE;color:#1E40AF',
  Qualified: 'background:#EDE9FE;color:#5B21B6',
  'Visit Scheduled': 'background:#FEF3C7;color:#92400E',
  Negotiation: 'background:#FED7AA;color:#9A3412',
  Won: 'background:#D1FAE5;color:#065F46',
  Lost: 'background:#FEE2E2;color:#991B1B',
};
