export const DEMO_GOAL =
  'Review this week\'s vendor invoices, identify likely duplicate charges, prepare refunds under $500, and only execute low-risk refunds. Anything uncertain should require approval.';

export const DEMO_INVOICES = [
  { invoiceId: 'INV-1042', vendor: 'Acme Cloud', serviceDate: '2026-10-12', amount: 420, status: 'open' },
  { invoiceId: 'INV-1048', vendor: 'Acme Cloud', serviceDate: '2026-10-12', amount: 420, status: 'open' },
  { invoiceId: 'INV-1051', vendor: 'Kestrel Security', serviceDate: '2026-10-11', amount: 742, status: 'open' },
  { invoiceId: 'INV-1052', vendor: 'Kestrel Security', serviceDate: '2026-10-11', amount: 742, status: 'open' },
  { invoiceId: 'INV-1060', vendor: 'Lumen Labs', serviceDate: '2026-10-10', amount: 210, status: 'open' },
  { invoiceId: 'INV-1061', vendor: 'Lumen Labs', serviceDate: '2026-10-10', amount: 204, status: 'open' },
  { invoiceId: 'INV-1067', vendor: 'Northstar Freight', serviceDate: '2026-10-09', amount: 318, status: 'open' },
  { invoiceId: 'INV-1071', vendor: 'Morrow Office', serviceDate: '2026-10-08', amount: 96, status: 'open' }
];

export const DEMO_RUN_AT = '2026-10-15T09:30:00.000Z';
