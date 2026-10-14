# screenshot-check

[![npm](https://img.shields.io/npm/v/%40njweber%2Fscreenshot-check)](https://www.npmjs.com/package/@njweber/screenshot-check) [![downloads](https://img.shields.io/npm/dm/%40njweber%2Fscreenshot-check)](https://www.npmjs.com/package/@njweber/screenshot-check) [![CI](https://github.com/nwebersoftware/screenshot-check/actions/workflows/ci.yml/badge.svg)](https://github.com/nwebersoftware/screenshot-check/actions/workflows/ci.yml)


**Check store screenshots against the rules before upload.** Google Play rejects screenshots for
size/ratio reasons that are trivial to verify — and the App Store wants native iPhone sizes.

```bash
npx @njweber/screenshot-check ./screenshots
npx @njweber/screenshot-check ./screenshots --ios
```

```
screenshot-check — store screenshot audit
input: ./screenshots

✓ ./screenshots/01.png:min  1080×1920 png portrait — shorter side must be ≥ 320px
✓ ./screenshots/01.png:max  1080×1920 — longer side must be ≤ 3840px
✓ ./screenshots/01.png:ratio  1080×1920 — aspect ratio 1.78:1 exceeds 2:1
! count  1 screenshot(s) — Google Play wants 2–8

PASS (1 warning)
```

## What it checks

**Google Play (default)**
- shorter side **≥ 320px**, longer side **≤ 3840px**
- aspect ratio **≤ 2:1**
- count **2–8**
- format PNG or JPEG

**App Store (`--ios`)**
- flags non-native iPhone sizes (App Store Connect scales, but native renders best)
- flags PNG alpha channels
- count **3–10**

## Why

Store rejections and upload errors from screenshot geometry are pure busywork. Catch them locally in a
second instead of after an upload round-trip.

## Notes

- The **hard** limits (Play's 320–3840px and 2:1) are enforced as failures; **guidance** (native iPhone
  sizes, alpha, counts) is reported as warnings — over-strict failures would be worse than useless.
- Point it at a folder or individual files; `.png`, `.jpg`, `.jpeg`.

## Exit codes

`0` clean · `1` blocking issue(s) · `2` bad input.

## Family

`app-check` · `store-check` · `android-manifest-check` · `ipa-check` · `privacy-check` · `icon-check`

## License

MIT.
