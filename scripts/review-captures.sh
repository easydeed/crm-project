#!/usr/bin/env bash
set -euo pipefail
ROOT=$PWD
EVIDENCE="$ROOT/preview/or056-pixels"
mkdir -p "$EVIDENCE"

archive() {
  mkdir -p "$1"
  git archive "$2" | tar -x -C "$1"
  ln -s "$ROOT/node_modules" "$1/node_modules"
}

capture() {
  local checkout=$1 name=$2 build=$3
  pushd "$checkout" >/dev/null
  if [ "$build" = yes ]; then pnpm build >"$EVIDENCE/$name-build.log" 2>&1; fi
  pnpm db:seed >"$EVIDENCE/$name-seed.log" 2>&1
  pnpm e2e:setup >>"$EVIDENCE/$name-seed.log" 2>&1
  cat >capture.config.ts <<'CONFIG'
import base from './playwright.config'
export default { ...base, projects: base.projects?.filter(p => ['setup', 'desktop'].includes(p.name!)).map(p => p.name === 'desktop' ? { ...p, testMatch: /screens\.spec\.ts/ } : p) }
CONFIG
  pnpm exec playwright test --config capture.config.ts --project=setup --project=desktop >"$EVIDENCE/$name-browser.log" 2>&1
  mkdir -p "$EVIDENCE/$name"
  cp e2e/screenshots/desktop/*.png "$EVIDENCE/$name/"
  rm capture.config.ts
  popd >/dev/null
}

strict_pixels() {
  local checkout=$1 name=$2 update=$3
  pushd "$checkout" >/dev/null
  pnpm db:seed >"$EVIDENCE/$name-seed.log" 2>&1
  pnpm e2e:setup >>"$EVIDENCE/$name-seed.log" 2>&1
  cat >capture.config.ts <<'CONFIG'
import base from './playwright.config'
export default { ...base, projects: base.projects?.filter(p => ['setup', 'desktop'].includes(p.name!)).map(p => p.name === 'desktop' ? { ...p, testMatch: /desktop-unchanged\.spec\.ts/ } : p) }
CONFIG
  local flags=()
  if [ "$update" = yes ]; then flags+=(--update-snapshots=all); fi
  PW_DESKTOP_COMPARE=1 pnpm exec playwright test --config capture.config.ts --project=setup --project=desktop "${flags[@]}" >"$EVIDENCE/$name-browser.log" 2>&1
  rm capture.config.ts
  popd >/dev/null
}

extra_capture() {
  local checkout=$1 name=$2
  if [ "$checkout" != "$ROOT" ]; then cp "$ROOT/e2e/review-visual.spec.ts" "$checkout/e2e/review-visual.spec.ts"; fi
  pushd "$checkout" >/dev/null
  pnpm db:seed >"$EVIDENCE/$name-extra-seed.log" 2>&1
  pnpm e2e:setup >>"$EVIDENCE/$name-extra-seed.log" 2>&1
  cat >capture.config.ts <<'CONFIG'
import base from './playwright.config'
export default { ...base, projects: base.projects?.filter(p => ['setup', 'desktop'].includes(p.name!)).map(p => p.name === 'desktop' ? { ...p, testMatch: /review-visual\.spec\.ts/ } : p) }
CONFIG
  local baseline=0
  if [ "$name" = main ]; then baseline=1; fi
  OR056_BASELINE="$baseline" OR056_CAPTURE_DIR="$EVIDENCE/$name-extra" pnpm exec playwright test --config capture.config.ts --project=setup --project=desktop >"$EVIDENCE/$name-extra-browser.log" 2>&1
  rm capture.config.ts
  popd >/dev/null
}

archive "$RUNNER_TEMP/or056-parent" 775f7d0
archive "$RUNNER_TEMP/or056-main" 1088036
capture "$RUNNER_TEMP/or056-parent" parent yes
capture "$RUNNER_TEMP/or056-main" main yes
capture "$RUNNER_TEMP/or056-main" main-repeat no
capture "$ROOT" head yes
node scripts/compare-screen-pixels.mjs "$EVIDENCE/parent" "$EVIDENCE/main" "$EVIDENCE/or055.json" --require-marketing
node scripts/compare-screen-pixels.mjs "$EVIDENCE/main" "$EVIDENCE/main-repeat" "$EVIDENCE/stability.json" --require-marketing
node scripts/compare-screen-pixels.mjs "$EVIDENCE/main" "$EVIDENCE/head" "$EVIDENCE/or056.json" --require-marketing
strict_pixels "$RUNNER_TEMP/or056-main" main-baseline yes
mkdir -p e2e/__snapshots-local__/
cp "$RUNNER_TEMP/or056-main"/e2e/__snapshots-local__/*.png e2e/__snapshots-local__/
strict_pixels "$ROOT" head-strict no
extra_capture "$RUNNER_TEMP/or056-main" main
extra_capture "$ROOT" head
node scripts/compare-screen-pixels.mjs "$EVIDENCE/main-extra" "$EVIDENCE/head-extra" "$EVIDENCE/or056-extra.json"
