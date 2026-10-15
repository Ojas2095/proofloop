import { DEMO_RUN_AT } from '../fixtures.js';
import { generatePlan } from './plan.js';
import { evaluateCandidate } from './risk.js';

function event(id, minute, type, title, detail, metadata = {}) {
  const time = new Date(new Date(DEMO_RUN_AT).getTime() + minute * 60_000).toISOString();
  return { id, time, type, title, detail, metadata };
}

function findCandidates(invoices) {
  const candidates = [];
  for (let left = 0; left < invoices.length; left += 1) {
    for (let right = left + 1; right < invoices.length; right += 1) {
      const a = invoices[left];
      const b = invoices[right];
      const sameVendor = a.vendor.toLowerCase() === b.vendor.toLowerCase();
      const sameDate = a.serviceDate === b.serviceDate;
      const amountDelta = Math.abs(a.amount - b.amount);
      if (!sameVendor || !sameDate || amountDelta > 10) continue;

      const exact = amountDelta === 0;
      candidates.push({
        id: `PAIR-${String(candidates.length + 1).padStart(2, '0')}`,
        invoiceIds: [a.invoiceId, b.invoiceId],
        vendor: a.vendor,
        serviceDate: a.serviceDate,
        amount: Math.max(a.amount, b.amount),
        confidence: exact ? 0.97 : 0.84,
        rationale: exact
          ? `Same vendor, same service date, same amount ($${a.amount.toFixed(2)}).`
          : `Same vendor and date, but the amounts differ by $${amountDelta.toFixed(2)}.`
      });
    }
  }
  return candidates;
}

export function runWorkflow(goal, invoices) {
  const plan = generatePlan(goal);
  const candidates = findCandidates(invoices).map((candidate) => evaluateCandidate(candidate, plan.constraints));
  const ledger = [
    event('EVT-001', 0, 'plan', 'Plan generated', `Local planner translated the goal into ${plan.steps.length} inspectable steps.`, { confidence: plan.confidence }),
    event('EVT-002', 1, 'input', 'Records loaded', `${invoices.length} vendor invoices loaded from the local fixture.`, { records: invoices.length })
  ];

  candidates.forEach((candidate, index) => {
    const base = 3 + index * 3;
    ledger.push(event(`EVT-${String(base).padStart(3, '0')}`, base - 2, 'detection', `${candidate.id} detected`, candidate.rationale, { candidateId: candidate.id, confidence: candidate.confidence }));
    ledger.push(event(`EVT-${String(base + 1).padStart(3, '0')}`, base - 1, 'decision', `${candidate.id} gates evaluated`, candidate.gates.filter((gate) => gate.status !== 'pass').map((gate) => `${gate.label}: ${gate.status}`).join(' · ') || 'All policy gates passed.', { candidateId: candidate.id, gates: candidate.gates }));
    const outcome = candidate.status === 'approved' ? 'simulated refund approved' : candidate.status === 'approval' ? 'approval request created' : 'action blocked';
    ledger.push(event(`EVT-${String(base + 2).padStart(3, '0')}`, base, 'outcome', `${candidate.id} ${outcome}`, candidate.status === 'blocked' ? candidate.gates.find((gate) => gate.status === 'block').evidence : candidate.status === 'approval' ? 'A human must review the uncertain match before any refund.' : 'Low-risk duplicate; no live side effect was performed.', { candidateId: candidate.id, status: candidate.status }));
  });

  const counts = {
    records: invoices.length,
    candidates: candidates.length,
    approved: candidates.filter((candidate) => candidate.status === 'approved').length,
    blocked: candidates.filter((candidate) => candidate.status === 'blocked').length,
    approval: candidates.filter((candidate) => candidate.status === 'approval').length,
    evidence: ledger.length + 1
  };
  ledger.push(event(`EVT-${String(ledger.length + 1).padStart(3, '0')}`, 12, 'summary', 'Workflow complete', `${counts.approved} action simulated, ${counts.blocked} blocked, and ${counts.approval} approval request created.`, counts));

  return { goal: plan.goal, runAt: DEMO_RUN_AT, mode: 'deterministic simulation', plan, candidates, counts, ledger };
}
