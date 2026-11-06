# Waitlist backend: Google Sheets via Apps Script

The landing page posts `{ email, lang, source, createdAt }` to a Google Apps Script web app,
which appends a row to a Google Sheet. Code: [`google-apps-script/Code.gs`](google-apps-script/Code.gs).

## Setup (one time)

1. Create a Google Sheet, e.g. **Libramigo Waitlist**.
2. In the sheet: **Extensions → Apps Script**. Replace the default code with `Code.gs`, save.
3. In the editor toolbar pick the function **setup** and press **Run**. Grant the permissions
   (sheet access and "Send email as you"). Without this step the web app answers with an
   authorization error.
4. **Deploy → New deployment →** type **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   Authorize when asked.
5. Copy the **Web app URL** (ends with `/exec`).
6. In the GitHub repository: **Settings → Secrets and variables → Actions → Variables →
   New repository variable** `PUBLIC_WAITLIST_ENDPOINT` = that URL. Re-run the deploy workflow.

The sheet tab `Waitlist` and its header row (`receivedAt, email, lang, source, createdAt`)
are created on the first submission.

## Updating the script

Edit the code, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
The `/exec` URL stays the same. (Saving alone does not update the live web app.)

## Behaviour

| Request | Response |
|---|---|
| JSON body, `Content-Type: text/plain` (from the page script) | `{ "ok": true, "duplicate": false }` / `{ "ok": false, "error": "invalid_email" \| "bad_request" }` |
| Form post without JavaScript | Small localized HTML page with a link back to the site |

- Emails are trimmed, lower-cased and stored once (a repeat returns `ok: true, duplicate: true`).
- Each new (non-duplicate) signup sends a notification email to the Google account that owns
  the script, with Reply-To set to the subscriber. Consumer Gmail quota: about 100 emails/day.
  The first deployment asks for an extra "Send email as you" permission.
- Values starting with `= + - @` are prefixed with `'` so Sheets never evaluates them as formulas.
- `text/plain` is deliberate: Apps Script cannot answer CORS preflight (`OPTIONS`) requests,
  and a `text/plain` POST is a "simple request" that needs none. Apps Script always returns
  HTTP 200, so the page checks `ok` in the body.

## Manual check

```sh
curl -L -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"email":"test@numune.az","lang":"az","source":"landing","createdAt":"2026-01-01T00:00:00Z"}' \
  'https://script.google.com/macros/s/…/exec'
# → {"ok":true,"duplicate":false}
```

## Privacy

The sheet contains personal data (email addresses). Share it only with people who need it.
The endpoint is public by design; anyone can submit an address. If spam becomes a problem,
add a honeypot field or rate limiting in `Code.gs`.
