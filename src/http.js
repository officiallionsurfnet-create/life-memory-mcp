#!/usr/bin/env node
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createLifeMemoryServer } from './server.js';
import { MemoryStore } from './storage.js';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.MEMORY_API_KEY || '';
const store = await new MemoryStore().init();

const handler = createMcpHandler(async () => createLifeMemoryServer({ store }));
const app = createMcpExpressApp();

if (apiKey) {
  app.use('/mcp', (req, res, next) => {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${apiKey}`) return res.status(401).json({ error: 'Unauthorized' });
    next();
  });
}

const node = toNodeHandler(handler);
app.all('/mcp', (req, res) => void node(req, res, req.body));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'life-memory-mcp', version: '0.1.0' }));

app.listen(port, host, () => {
  console.error(`Life Memory MCP HTTP listening on http://${host}:${port}/mcp`);
  if (!apiKey && host !== '127.0.0.1' && host !== 'localhost') {
    console.error('WARNING: MEMORY_API_KEY is not set. Do not expose this server publicly without authentication.');
  }
});
