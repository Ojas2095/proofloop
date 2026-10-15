const DEFAULT_THRESHOLD = 500;

export function normalizeGoal(goal) {
  if (typeof goal !== 'string' || goal.trim().length < 12) {
    throw new TypeError('Goal must be a meaningful sentence.');
  }
  return goal.trim().replace(/\s+/g, ' ');
}

function extractThreshold(goal) {
  const match = goal.match(/(?:under|below|less than)\s+\$?([\d,]+)/i);
  return match ? Number(match[1].replaceAll(',', '')) : DEFAULT_THRESHOLD;
}

export function generatePlan(input) {
  const goal = normalizeGoal(typeof input === 'string' ? input : input?.goal);
  const threshold = extractThreshold(goal);
  const requiresLowRisk = /low[- ]risk|only execute|automatically/i.test(goal);

  return {
    version: '1.0',
    goal,
    planner: 'proofloop-local-planner',
    confidence: 0.94,
    constraints: {
      automaticRefundLimit: threshold,
      requiresLowRisk,
      uncertainNeedsApproval: /uncertain|approval|review/i.test(goal) || requiresLowRisk
    },
    steps: [
      { id: 'inspect-records', label: 'Inspect invoice records', detail: 'Load and normalize vendor, date, amount, and invoice ID.', status: 'ready' },
      { id: 'detect-duplicates', label: 'Detect duplicate candidates', detail: 'Compare invoices by vendor, service date, and amount similarity.', status: 'ready' },
      { id: 'evaluate-gates', label: 'Evaluate risk gates', detail: 'Check confidence, refund limit, identifiers, and reversibility.', status: 'ready' },
      { id: 'simulate-actions', label: 'Simulate approved actions', detail: 'Only low-risk, policy-compliant refunds can be simulated.', status: 'waiting' },
      { id: 'write-evidence', label: 'Write evidence ledger', detail: 'Record the input, policy decision, and outcome for every candidate.', status: 'waiting' }
    ],
    gates: [
      { id: 'confidence', label: 'Duplicate confidence ≥ 90%', type: 'confidence', description: 'Ambiguous matches pause for a human.' },
      { id: 'refund-limit', label: `Refund amount below $${threshold}`, type: 'threshold', description: 'Over-limit refunds never execute automatically.' },
      { id: 'invoice-id', label: 'Invoice identifiers present', type: 'identity', description: 'Missing identity data fails closed.' },
      { id: 'reversible', label: 'Action is reversible or simulated', type: 'reversibility', description: 'This local demo never touches a live account.' }
    ],
    rationale: [
      { phrase: 'under $' + threshold, meaning: 'automatic refund threshold' },
      { phrase: 'low-risk', meaning: 'confidence and policy gates' },
      { phrase: 'only execute', meaning: 'blocked items remain unexecuted' }
    ]
  };
}
