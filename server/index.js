import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_GOAL, DEMO_INVOICES } from '../src/fixtures.js';
import { generatePlan } from '../src/domain/plan.js';
import { runWorkflow } from '../src/domain/workflow.js';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(payload));
}

async function serveStatic(response, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = normalize(join(root, requested));
  const rootPrefix = root.endsWith(sep) ? root : root + sep;
  if (!file.startsWith(rootPrefix) && file !== root) return sendJson(response, 403, { error: 'Forbidden' });
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    response.end(body);
  } catch {
    sendJson(response, 404, { error: 'Not found' });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/api/health') return sendJson(response, 200, { ok: true, mode: 'deterministic simulation' });
  if (url.pathname === '/api/demo') return sendJson(response, 200, runWorkflow(DEMO_GOAL, DEMO_INVOICES));
  if (url.pathname === '/api/plan') {
    try {
      return sendJson(response, 200, generatePlan(url.searchParams.get('goal') || DEMO_GOAL));
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
  }
  return serveStatic(response, url.pathname);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`ProofLoop listening on http://localhost:${port}`);
});
