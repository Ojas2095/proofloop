const state = { run: null, filter: 'all' };
const $ = (selector) => document.querySelector(selector);

const goal = $('#goal');
const workspace = $('#workspace');
const results = $('#results');

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function renderPlan(plan) {
  $('#plan-steps').innerHTML = plan.steps.map((step, index) => `
    <div class="plan-step">
      <span class="step-num">${String(index + 1).padStart(2, '0')}</span>
      <div><div class="step-name">${step.label}</div><p class="step-detail">${step.detail}</p></div>
      <span class="step-status ${step.status === 'waiting' ? 'waiting' : ''}">${step.status}</span>
    </div>`).join('');
  $('#rationale').innerHTML = plan.rationale.map((item) => `<span class="rationale-item"><b>“${item.phrase}”</b> → ${item.meaning}</span>`).join('');
  $('#gates').innerHTML = plan.gates.map((gate) => `<div class="gate"><span class="gate-icon">✓</span><div><div class="gate-name">${gate.label}</div><p class="gate-description">${gate.description}</p></div></div>`).join('');
}

async function getPlan() {
  const response = await fetch(`/api/plan?goal=${encodeURIComponent(goal.value)}`);
  if (!response.ok) throw new Error((await response.json()).error || 'Could not generate plan.');
  return response.json();
}

async function showWorkspace() {
  try {
    const plan = await getPlan();
    renderPlan(plan);
    $('#composer').classList.add('hidden');
    workspace.classList.remove('hidden');
    workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    goal.focus();
    goal.setCustomValidity(error.message);
    goal.reportValidity();
    goal.setCustomValidity('');
  }
}

function statusLabel(status) {
  return status === 'approval' ? 'NEEDS APPROVAL' : status.toUpperCase();
}

function renderResults(run) {
  const metrics = [
    ['records', run.counts.records, 'records inspected', ''],
    ['candidates', run.counts.candidates, 'duplicate candidates', ''],
    ['approved', run.counts.approved, 'refund simulated', 'teal'],
    ['blocked', run.counts.blocked, 'actions blocked', 'red'],
    ['approval', run.counts.approval, 'approval requested', 'amber']
  ];
  $('#metrics').innerHTML = metrics.map((item) => `<div class="metric ${item[3]}"><span class="metric-value">${item[1]}</span><span class="metric-label">${item[2]}</span></div>`).join('');
  $('#ledger-count').textContent = `${run.counts.evidence} receipts`;
  $('#event-stream').innerHTML = run.ledger.slice(-7).map((item) => `<div class="event ${item.type}"><span class="event-time">${item.id}</span><div><div class="event-title"><i class="event-mark"></i>${item.title}</div><p class="event-detail">${item.detail}</p></div></div>`).join('');
  renderLedger();
}

function renderLedger() {
  const visible = state.run.ledger.filter((item) => {
    if (state.filter === 'all') return true;
    if (state.filter === 'blocked') return item.metadata.status === 'blocked';
    return item.type === state.filter;
  });
  $('#ledger').innerHTML = visible.map((item) => `<div class="ledger-item ${item.metadata.status || ''}" data-id="${item.id}"><div class="ledger-top"><span class="ledger-id">${item.id} · ${new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span class="ledger-type">${item.type}</span></div><div class="ledger-title">${item.title}</div><p class="ledger-detail">${item.detail}</p></div>`).join('') || '<div class="ledger-empty">No evidence in this view.</div>';
  document.querySelectorAll('.ledger-item').forEach((item) => item.addEventListener('click', () => item.classList.toggle('expanded')));
}

async function runSimulation() {
  const button = $('#run');
  button.disabled = true;
  button.innerHTML = 'Running control plane <span>…</span>';
  const response = await fetch('/api/demo');
  state.run = await response.json();
  state.filter = 'all';
  renderResults(state.run);
  workspace.classList.add('hidden');
  results.classList.remove('hidden');
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  button.disabled = false;
  button.innerHTML = 'Run simulation <span>→</span>';
}

function restart() {
  results.classList.add('hidden');
  $('#composer').classList.remove('hidden');
  $('#composer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('#generate').addEventListener('click', showWorkspace);
$('#edit').addEventListener('click', () => { workspace.classList.add('hidden'); $('#composer').classList.remove('hidden'); $('#composer').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('#run').addEventListener('click', runSimulation);
$('#replay').addEventListener('click', runSimulation);
$('#restart').addEventListener('click', restart);
$('#export').addEventListener('click', () => {
  const file = new Blob([JSON.stringify(state.run, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = 'proofloop-evidence.json';
  link.click();
  URL.revokeObjectURL(link.href);
});
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  state.filter = button.dataset.filter;
  renderLedger();
}));

goal.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') showWorkspace();
});
