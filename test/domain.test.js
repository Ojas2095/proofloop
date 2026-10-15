import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_GOAL, DEMO_INVOICES } from '../src/fixtures.js';
import { generatePlan } from '../src/domain/plan.js';
import { evaluateCandidate } from '../src/domain/risk.js';
import { runWorkflow } from '../src/domain/workflow.js';

test('generatePlan creates a deterministic, ordered safety contract', () => {
  const first = generatePlan(DEMO_GOAL);
  const second = generatePlan(`  ${DEMO_GOAL}  `);
  assert.deepEqual(first, second);
  assert.equal(first.steps.length, 5);
  assert.equal(first.steps[0].id, 'inspect-records');
  assert.equal(first.constraints.automaticRefundLimit, 500);
  assert.equal(first.constraints.uncertainNeedsApproval, true);
});

test('generatePlan rejects empty or meaningless objectives', () => {
  assert.throws(() => generatePlan(''), /meaningful sentence/);
  assert.throws(() => generatePlan('   '), /meaningful sentence/);
  assert.throws(() => generatePlan(undefined), /meaningful sentence/);
});

test('risk evaluation fails closed for over-limit actions', () => {
  const candidate = evaluateCandidate({ id: 'PAIR-01', invoiceIds: ['A', 'B'], vendor: 'Vendor', serviceDate: '2026-01-01', amount: 742, confidence: 0.97 }, { automaticRefundLimit: 500 });
  assert.equal(candidate.status, 'blocked');
  assert.equal(candidate.risk, 'high');
  assert.equal(candidate.gates.find((gate) => gate.id === 'refund-limit').status, 'block');
});

test('risk evaluation routes uncertain but compliant actions to approval', () => {
  const candidate = evaluateCandidate({ id: 'PAIR-02', invoiceIds: ['A', 'B'], vendor: 'Vendor', serviceDate: '2026-01-01', amount: 204, confidence: 0.84 }, { automaticRefundLimit: 500 });
  assert.equal(candidate.status, 'approval');
  assert.equal(candidate.risk, 'medium');
});

test('workflow produces one safe action, one blocked action, and one approval request', () => {
  const run = runWorkflow(DEMO_GOAL, DEMO_INVOICES);
  assert.deepEqual(run.counts, { records: 8, candidates: 3, approved: 1, blocked: 1, approval: 1, evidence: 12 });
  assert.equal(run.ledger.at(-1).type, 'summary');
  assert.equal(run.ledger.length, 12);
  assert.equal(run.candidates.find((candidate) => candidate.amount === 742).status, 'blocked');
});

test('workflow replay is byte-for-byte deterministic', () => {
  assert.deepEqual(runWorkflow(DEMO_GOAL, DEMO_INVOICES), runWorkflow(DEMO_GOAL, DEMO_INVOICES));
});
