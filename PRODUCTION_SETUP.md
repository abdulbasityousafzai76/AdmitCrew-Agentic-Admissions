# AdmitCrew integration setup and remaining checks

This package keeps the existing practice demo working. It does not contain passwords or access tokens. Do not upload real student documents to the practice app. The office must verify its program data before using any real channel.

## What this update adds

- Optional OpenAI answer wording after deterministic matching against one program. The output is checked against the exact saved facts; any API failure or mismatch uses the original database answer. Nothing is delivered without staff approval.
- Local OCR for clearly labeled fake PNG/JPEG documents using Tesseract and Pillow. Poor image text returns `needs_review`. PDF extraction still uses `pypdf`.
- Individual email/password staff sign-in through Supabase Auth. Every request checks the active `staff_members` membership, and approvals record that user's ID. The old shared-password mode remains available for the demo.
- Signed WhatsApp/Facebook inbound webhooks and optional Meta outbound transport. Drafts from these conversations enter the same staff approval queue. External sending is disabled by default; no credentials are in the ZIP. Ambiguous external delivery is marked `delivery_unknown`, never automatically retried.

## Install on a separate copy first

Preserve the existing private `.env` file. Copy these new project files into a separate folder and copy your private settings there. Install `pypdf` and `Pillow` using `py -m pip install pypdf Pillow`. Install Tesseract OCR for Windows and set `TESSERACT_CMD` to its executable path if it is not on PATH. Run `Run-AdmitCrew-Tests.bat` before replacing the running app. The current demo remains on port 8765; only start one copy at a time.

The database migration `meta_channel_migration.sql` is already applied to the AdmitCrew Supabase project. It lets Facebook contacts exist without inventing a phone number and creates the RLS-protected `channel_contacts` mapping. The reminder RPC now selects only fake test leads with a phone number; it cannot create a test-chat draft for a real Facebook contact.

## Individual staff accounts

1. Create each staff person in **Supabase Auth → Users** through the dashboard or invitation flow. Link each Auth user ID to an active `public.staff_members` row with their own display name and role. Do not insert directly into `auth.users` with SQL.
2. Put the project's publishable key in the server's private `.env` as `SUPABASE_PUBLISHABLE_KEY`. Set `STAFF_AUTH_MODE=supabase`. Staff will then see email and password fields. There is no public staff sign-up page.
3. After confirming all staff can log in, remove the old `STAFF_PASSWORD` from the private settings. Deactivate a `staff_members` row to revoke dashboard access. Do not share logins.

## AI wording and OCR

Set `OPENAI_API_KEY` in the server's private `.env` only if AI wording is desired; leave it blank for exact deterministic replies. `OPENAI_MODEL` can be changed. The app sends the matched answer and student's question to the AI provider, so get the office's approval and privacy process in place before using this with real students. Fake document bytes stay on the local server; they are not sent to OpenAI. Images must be clearly labeled fake test documents, under 4 MB, and PNG or JPEG.

## WhatsApp and Facebook

1. Obtain an official Meta app, WhatsApp Business phone number ID and access token, and/or Facebook Page ID and Page access token. Configure `META_APP_SECRET`, a private `META_VERIFY_TOKEN`, and the respective channel credentials in `.env`. Never put them in browser JavaScript, n8n JSON, or Git.
2. Deploy the Python backend behind public HTTPS with a stable domain, access controls, logging, backups, and a separate database key. Meta cannot call a `127.0.0.1` webhook. Subscribe both channels' message events to `https://YOUR_DOMAIN/api/meta/webhook`; the endpoint verifies `X-Hub-Signature-256` before processing POSTs and answers Meta's GET verification challenge.
3. Keep `EXTERNAL_DELIVERY_ENABLED=false` until a real Meta test account has received an inbound message and staff have reviewed the corresponding draft. Then enable it in the private server environment. The service sends only after staff clicks Approve. A free-form reply is blocked after 24 hours from the last inbound message. No external reminder is sent: template approval and template-to-draft matching need a separate implementation.
4. If a provider call times out, status becomes `delivery_unknown`; check Meta's delivery record manually before any follow-up. Do not simply retry, because that could duplicate a message.

This is an integration preview. Live Meta delivery has **not** been tested, Meta account configuration is **not** complete, and real document intake/student identity verification are **not** ready. Do not set `EXTERNAL_DELIVERY_ENABLED=true` for real students until those checks are done.

## Rotate earlier keys

Earlier Supabase secret values appeared in chat. If either remains active, revoke or rotate it in the Supabase project and update the private `.env` on the server. Restart the server and rerun `setup_check.py`. Do not paste the replacement into chat. This package has no secret values.
