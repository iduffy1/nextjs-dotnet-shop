# Review guidelines

## Project context
Monorepo: `api/` is an ASP.NET Core minimal API (C#). `web/` is a Next.js App Router app (React, TypeScript).
The browser never calls the .NET API directly; Next.js server code does.

## Must flag
- Prices or totals taken from the client. The API must look up prices server-side and use `decimal`.
- Server-only code (`lib/api.ts`, env vars without NEXT_PUBLIC_) imported into a "use client" file.
- React hooks called conditionally or after an early return.
- State mutated in place instead of creating new arrays/objects.
- Missing input validation in API endpoints or Server Actions.
- Functions returning null for unexpected failures (should throw); null is only for expected "not found".
- String interpolation in single/double quotes instead of backtick template literals.
- Inverted or double-negated conditions (e.g. `!!res.ok` where `!res.ok` was meant).
- Thread-safety issues in singleton services.

## Don't comment on
- Formatting or style that a linter handles.
- Minor naming preferences.

## Output format
- A one-line summary.
- Then each issue as: **[severity: high/medium/low]** `file:line` – problem – suggested fix.
- If there are no significant issues, say so briefly. Do not invent problems.