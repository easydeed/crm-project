# OR-029a — Local fonts

```
TASK: OR-029a
BRANCH: fix/local-fonts

OBJECTIVE
Builds no longer depend on fonts.googleapis.com.

WHY
next/font/google fetches at build time. It returned something
unparseable during OR-029's break proof, failing a CI job for reasons
unrelated to the change. Every packet from here rebuilds many times.

DESIRED BEHAVIOR
1. Bundle the Inter and Fraunces font files in the repo and load them
   with next/font/local. Only the weights and subsets actually used —
   report which and the total size added.
2. No new npm dependency.
3. A source test fails the build if next/font/google is imported
   anywhere.
4. Fraunces stays preload:false and unused, same as OR-028.
5. Rendering must be identical. Prove it with the desktop pixel
   comparison against the OR-029 baselines: zero screens changed.

ACCEPTANCE CRITERIA
1. No import of next/font/google anywhere, enforced by a source test
2. Desktop comparison shows zero changed screens
3. Browser pass 37/37
4. No dependency added; report the bytes added to the repo
5. pnpm verify passes, CI green before merge

DO NOT
- Change any token or markup
- Add weights beyond what is used
```
