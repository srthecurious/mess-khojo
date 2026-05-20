---
name: pre-push-check
description: Runs a full pre-push quality gate for the MessKhojo project. Executes ESLint, production build, secret scanning, .env leak detection, npm audit, Firestore rules safety, and a git status summary. Call this before every git push to catch issues early.
---

# Pre-Push Quality Gate — MessKhojo

## When to Use This Skill
- Before running `git push`
- When the user says "run pre-push checks", "check before push", or `/pre-push-check`
- After a significant set of changes to verify nothing is broken

## How to Execute

Run the PowerShell check script from the project root:

```powershell
powershell.exe -ExecutionPolicy Bypass -File ".agents\skills\pre-push-check\scripts\run_checks.ps1"
```

Use the `run_command` tool (Cwd should be the mess-khojo project root):
- CommandLine: `powershell.exe -ExecutionPolicy Bypass -File ".agents\skills\pre-push-check\scripts\run_checks.ps1"`
- Cwd: `c:\Users\barma\.gemini\antigravity\scratch\mess-khojo`
- WaitMsBeforeAsync: 120000  (build can take up to 2 minutes)

## Interpreting Results

The script prints a section-by-section report. Each check prints either:
- `[PASS]` — check passed, no action needed
- `[FAIL]` — check failed, you MUST fix before pushing
- `[WARN]` — non-blocking issue worth reviewing
- `[INFO]` — informational output

At the end, a summary table is printed. If **any** check is `[FAIL]`, do NOT push and instead:
1. Tell the user exactly which checks failed and why
2. Help them fix each failing issue
3. Re-run the checks to confirm all pass
4. Only then proceed with `git push`

## Checks Performed

| # | Check | Blocking |
|---|-------|---------|
| 1 | ESLint — zero errors | Yes |
| 2 | Vite production build | Yes |
| 3 | Secret / API key scanner | Yes |
| 4 | `.env` not tracked by git | Yes |
| 5 | `npm audit` (high + critical) | Yes |
| 6 | Firestore & Storage rules safety | Yes |
| 7 | Git staged files summary | No (info only) |

## Notes
- The script runs from `client/` for Node-related checks
- Secret scanning checks all tracked `.js`, `.jsx`, `.ts`, `.tsx`, `.json` files (excluding `node_modules` and `dist`)
- If the user wants to skip the build temporarily, they can pass `-SkipBuild` flag to the script
