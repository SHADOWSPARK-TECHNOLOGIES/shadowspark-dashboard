# Plan: Disable Vercel Production Deployment Protection (SSO)

## Goal
Disable Vercel SSO protection for **production** only so the public app is reachable, while keeping preview protection unchanged if present.

## Confirmed Inputs
- `projectId`: `prj_ax8pCZVJ68fDRZAuWo7jaVSCTOZJ` from `.vercel/project.json`.
- Verification target URL: `https://shadowspark-production-one.vercel.app`.
- No code changes, no commits.
- Never print the Vercel token.

## Execution Steps
1. Resolve project metadata
   - Read `.vercel/project.json` and extract `projectId`.
   - Fail fast if file missing or `projectId` empty.

2. Resolve Vercel CLI auth token from first existing path
   - Check in order:
     1. `~/.local/share/com.vercel.cli/auth.json`
     2. `~/.config/vercel/auth.json`
     3. `~/.now/auth.json`
   - Use the first file that exists and parse token (`token` field).
   - If no file or token found, stop with explicit error that local Vercel auth is missing.

3. Disable SSO protection at project level
   - Send:
     - Method: `PATCH`
     - URL: `https://api.vercel.com/v9/projects/<projectId>`
     - Header: `Authorization: Bearer <token>`
     - Body: `{"ssoProtection": null}`
   - Validate response status is success (2xx).
   - Do not log auth headers, token, or full response containing sensitive fields.

4. Verify public reachability on production deployment
   - Send:
     - Method: `POST`
     - URL: `https://shadowspark-production-one.vercel.app/api/proxy/v1/auth/login`
     - Header: `Content-Type: application/json`
     - Body: `{"email":"x","password":"y"}`
   - Capture HTTP code and response body.
   - Success criteria:
     - HTTP `401` with app JSON shape like `{"success":false,...}` OR
     - HTTP `200` from app endpoint.
   - Failure criteria:
     - Any Vercel protection/SSO gate response (e.g., "Protected deployment") or redirect/auth wall behavior.

5. Fallback path if verification endpoint cannot validate
   - If API path is unavailable/invalid for functional verification, print exactly:
     - `Settings → Deployment Protection → Production → disable Vercel Authentication`
   - Stop immediately after printing fallback path.

## Validation Checklist
- Production endpoint no longer serves Vercel deployment protection wall.
- Preview protection settings remain untouched (no preview-related API changes performed).
- Token never printed.
- No repository files modified.

## Risks and Mitigations
- Wrong auth file chosen:
  - Mitigation: strict ordered lookup and existence check.
- Token parsing mismatch:
  - Mitigation: verify parsed token non-empty before API call.
- Partial success not reflected yet (eventual propagation):
  - Mitigation: re-run verification once after short delay before declaring failure.
- Mistakenly changing preview rules:
  - Mitigation: patch only `ssoProtection` field; do not call endpoints that alter preview protection settings.

## Out of Scope
- Changing any application auth behavior.
- Modifying Vercel preview deployment protection configuration.
- Any source-code edits or git operations.
