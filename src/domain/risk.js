export function evaluateCandidate(candidate, policy) {
  const gates = [
    {
      id: 'confidence',
      label: 'Duplicate confidence ≥ 90%',
      status: candidate.confidence >= 0.9 ? 'pass' : 'review',
      evidence: `${Math.round(candidate.confidence * 100)}% match confidence from vendor, date, and amount.`
    },
    {
      id: 'refund-limit',
      label: `Refund amount below $${policy.automaticRefundLimit}`,
      status: candidate.amount < policy.automaticRefundLimit ? 'pass' : 'block',
      evidence: `$${candidate.amount.toFixed(2)} ${candidate.amount < policy.automaticRefundLimit ? 'is inside' : 'exceeds'} the automatic limit.`
    },
    {
      id: 'invoice-id',
      label: 'Invoice identifiers present',
      status: candidate.invoiceIds.every(Boolean) ? 'pass' : 'block',
      evidence: candidate.invoiceIds.every(Boolean) ? 'Both source invoices can be traced.' : 'A source invoice is missing its identifier.'
    },
    {
      id: 'reversible',
      label: 'Action is reversible or simulated',
      status: 'pass',
      evidence: 'ProofLoop is running in local simulation mode.'
    }
  ];

  const status = gates.some((gate) => gate.status === 'block')
    ? 'blocked'
    : gates.some((gate) => gate.status === 'review')
      ? 'approval'
      : 'approved';
  const risk = status === 'blocked' ? 'high' : status === 'approval' ? 'medium' : 'low';

  return { ...candidate, gates, status, risk };
}

export function riskBand(status) {
  return { approved: 'low', approval: 'medium', blocked: 'high' }[status] ?? 'high';
}
