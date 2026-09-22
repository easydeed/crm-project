# OR-007a — Name match tokens

```
TASK: OR-007a
BRANCH: fix/name-match-tokens

OBJECTIVE
Name matches fires only on whole-word surname match after foldText.

WHY
The review card label is evidence. A substring hit (Lee inside KLEEMAN,
Ng inside YOUNG) tells the agent a false story.

SCOPE
- Name matches helper (last name vs recorded owner)
- Tests for the six required cases
- Out of scope: matcher scoring, thresholds, review UI, admin matching

DESIRED BEHAVIOR
Compare as tokens after foldText. Whole words only.

1. Lee does NOT match KLEEMAN, ROBERT
2. Ng does NOT match YOUNG, SARAH
3. Okafor matches OKAFOR FAMILY TRUST
4. Okafor matches OKAFOR, MARILYN & DAVID
5. hyphenated Garcia-Lopez matches LOPEZ, ANA on either part
6. two-word De La Cruz matches DE LA CRUZ, ELENA

If already token-based, add tests only.

ACCEPTANCE CRITERIA
1. All six name-match cases pass
2. pnpm verify PASS
3. Open PR. GitHub Actions verify SUCCESS.
   Do NOT merge fix/name-match-tokens unless a later packet needs it
   (OR-008 does not).

DO NOT
- Change matcher scoring or thresholds
- Add an npm dependency
- Merge unless required under OR-008
- Touch crm production eajfpzavqvcvwkeicdww
```
