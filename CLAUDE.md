# CLAUDE.md

Nexora Outreach — AI cold email SaaS. Next.js 16 App Router, Supabase, Stripe, OpenAI.

## Always read at session start
- `.claude/COMMON_MISTAKES.md` — 5 bugs that will cost you time
- `.claude/ARCHITECTURE_MAP.md` — where everything lives
- `.claude/QUICK_START.md` — commands and patterns

## Load on demand
- `docs/learnings/` — topic-specific notes (load when relevant)
- `.claude/completions/` — past task history (0 tokens until asked)

---

## Code Rules
- Simplest working solution. No over-engineering.
- Read the file before modifying it. Never edit blind.
- No abstractions for single-use operations.
- No error handling for impossible scenarios.
- Three similar lines is better than a premature abstraction.

## Output
- Code first. Explanation only if non-obvious.
- No inline comments unless the why is non-obvious.
- No boilerplate unless asked.

## Review
- State the bug. Show the fix. Stop.
- No suggestions beyond the scope of the review.

## Debugging
- Never speculate without reading the relevant code first.
- State what you found, where, and the fix. One pass.
- If cause is unclear: say so. Do not guess.

## Formatting
- No em dashes, smart quotes, or decorative Unicode.
- Plain hyphens and straight quotes only.
- Code output must be copy-paste safe.
