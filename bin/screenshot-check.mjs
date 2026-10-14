#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { checkScreenshots, formatReport } from '../src/check.mjs';

const HELP = `screenshot-check — store screenshot audit

Usage:
  screenshot-check <dir | files...> [--ios]

Checks (default: Google Play):
  * shorter side 320–3840px, longer side ≤ 3840px, aspect ratio ≤ 2:1
  * count 2–8 (Google Play) / 3–10 (App Store)
  * --ios also checks for a native iPhone size and flags PNG alpha

Exit: 0 clean · 1 blocking issue(s) · 2 bad input.
`;

const args = process.argv.slice(2);
let platform = 'android';
const targets = [];
for (const a of args) {
  if (a === '--ios') platform = 'ios';
  else if (a === '--android') platform = 'android';
  else if (a === '-h' || a === '--help') { process.stdout.write(HELP); process.exit(0); }
  else if (a.startsWith('-')) { process.stderr.write(`unknown flag: ${a}\n`); process.exit(2); }
  else targets.push(a);
}

if (targets.length === 0) {
  process.stderr.write(HELP);
  process.exit(2);
}

const IMG = /\.(png|jpe?g)$/i;
const SKIP = new Set(['node_modules', '.git']);
const files = [];

function walk(p) {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
      const child = join(p, e.name);
      if (e.isDirectory()) walk(child);
      else if (IMG.test(e.name)) files.push(child);
    }
  } else if (IMG.test(p)) {
    files.push(p);
  }
}

try {
  for (const t of targets) walk(t);
} catch (e) {
  process.stderr.write(`${e.message}\n`);
  process.exit(2);
}

const items = [];
for (const f of files) {
  try {
    items.push({ name: f, buf: readFileSync(f) });
  } catch (e) {
    process.stderr.write(`cannot read ${f}: ${e.message}\n`);
  }
}

const report = checkScreenshots(items, { platform });
process.stdout.write(formatReport(report, targets.join(' ')) + '\n');
process.exit(report.ok ? 0 : 1);
