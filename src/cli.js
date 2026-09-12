#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createLifeMemoryServer } from './server.js';

serveStdio(() => createLifeMemoryServer());
console.error('Life Memory MCP running over stdio');
