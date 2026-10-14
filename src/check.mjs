import { parseImage } from './image.mjs';

/** App Store Connect's native iPhone sizes (portrait); landscape is the transpose. */
export const IOS_SIZES = [
  [1290, 2796], // 6.9"
  [1320, 2868], // 6.9"
  [1260, 2736], // 6.9"
  [1242, 2688], // 6.5"
  [1284, 2778], // 6.7"
  [1170, 2532], // 6.1"
  [1242, 2208], // 5.5"
];

const PLAY = { min: 320, max: 3840, maxRatio: 2.0, minCount: 2, maxCount: 8 };
const IOS = { minCount: 3, maxCount: 10 };

function finish(checks) {
  const failed = checks.filter((c) => c.severity === 'fail' && !c.ok);
  const warned = checks.filter((c) => c.severity === 'warn' && !c.ok);
  return { ok: failed.length === 0, checks, failed, warned };
}

const isIosSize = (w, h) => IOS_SIZES.some(([a, b]) => (w === a && h === b) || (w === b && h === a));

/**
 * Audit a set of screenshots. `items` = [{ name, buf }]; platform = 'android' | 'ios'.
 */
export function checkScreenshots(items, opts = {}) {
  const platform = opts.platform === 'ios' ? 'ios' : 'android';
  const checks = [];
  const add = (id, severity, ok, detail) => checks.push({ id, severity, ok, detail });

  if (items.length === 0) {
    add('screenshots', 'fail', false, 'no screenshots found (expect .png / .jpg / .jpeg)');
    return finish(checks);
  }

  for (const { name, buf } of items) {
    let img;
    try {
      img = parseImage(buf);
    } catch (e) {
      add(name, 'fail', false, `${e.message} — must be PNG or JPEG`);
      continue;
    }
    const { type, width: w, height: h } = img;
    const ratio = Math.max(w, h) / Math.min(w, h);
    const orient = h >= w ? 'portrait' : 'landscape';
    const dims = `${w}×${h} ${type} ${orient}`;

    if (platform === 'android') {
      const short = Math.min(w, h);
      const long = Math.max(w, h);
      const r = ratio.toFixed(2);
      add(`${name}:min`, 'fail', short >= PLAY.min, `${dims} — shorter side ${short}px ${short >= PLAY.min ? '≥' : '<'} ${PLAY.min}px minimum`);
      add(`${name}:max`, 'fail', long <= PLAY.max, `${dims} — longer side ${long}px ${long <= PLAY.max ? '≤' : '>'} ${PLAY.max}px maximum`);
      add(`${name}:ratio`, 'fail', ratio <= PLAY.maxRatio, `${dims} — aspect ratio ${r}:1 ${ratio <= PLAY.maxRatio ? '≤' : '>'} ${PLAY.maxRatio}:1`);
    } else {
      add(
        `${name}:size`,
        'warn',
        isIosSize(w, h),
        isIosSize(w, h)
          ? `${dims} — a native iPhone size`
          : `${dims} — not a standard iPhone size; App Store Connect will scale it, but a native size renders best`,
      );
      if (type === 'png') {
        add(
          `${name}:alpha`,
          'warn',
          !img.hasAlpha,
          img.hasAlpha
            ? `${dims} — PNG has an alpha channel (flatten screenshots to avoid surprises)`
            : `${dims} — no alpha channel`,
        );
      }
    }
  }

  const counts = platform === 'android' ? PLAY : IOS;
  add(
    'count',
    'warn',
    items.length >= counts.minCount && items.length <= counts.maxCount,
    `${items.length} screenshot(s) — ${platform === 'android' ? 'Google Play' : 'the App Store'} wants ${counts.minCount}–${counts.maxCount}`,
  );

  return finish(checks);
}

export function formatReport(report, label = '') {
  const out = ['screenshot-check — store screenshot audit'];
  if (label) out.push(`input: ${label}`);
  out.push('');
  for (const c of report.checks) {
    out.push(`${c.ok ? '✓' : c.severity === 'fail' ? '✗' : '!'} ${c.id}  ${c.detail}`);
  }
  out.push('');
  if (report.ok) out.push(report.warned.length ? `PASS (${report.warned.length} warning${report.warned.length > 1 ? 's' : ''})` : 'PASS — no issues found.');
  else out.push(`FAIL — ${report.failed.length} blocking issue${report.failed.length > 1 ? 's' : ''}.`);
  return out.join('\n');
}
