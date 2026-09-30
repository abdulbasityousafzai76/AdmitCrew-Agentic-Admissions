# AdmitCrew: Step-by-step setup

This is a **practice demo**. Use only the clearly labeled fake PDFs. University fees and deadlines are fictional practice values. A student-facing message reaches only the local test chat after staff approval.

> **Integration update:** The updated ZIP also contains optional AI wording, image OCR, individual Supabase Auth login, and Meta channel adapters. These are disabled until configured. Read `PRODUCTION_SETUP.md` before enabling them. The existing local demo steps below still use the shared-password test mode. The n8n workflow is published; the seven-case runner passed with T06 history, and the narrated website video is a walkthrough rather than all seven cases live.

## 1. Extract and check Python

1. Extract the ZIP and open the `admitcrew` folder.
2. Install Python 3.11 or newer.
3. In Windows PowerShell, run:

```powershell
py -m pip install pypdf
py -m unittest discover -s tests -v
```

These are focused local code tests. They are separate from the seven live assignment cases. The new ZIP contains the student and staff websites, their CSS and JavaScript, and the Python backend.

## 2. Supabase staff account — completed

The Auth user `cbe1175c-cb10-4c6d-9434-6f1a9469fee8` is linked to an active `staff` membership in the [AdmitCrew Supabase project](https://supabase.com/dashboard/project/bxzjunrthbdmicqwgzeh). The UUID is already present in `.env.example`.

## 3. Private local settings

1. Copy `.env.example` to `.env`: `Copy-Item .env.example .env`.
2. In Supabase **Settings → API Keys**, copy this project's backend secret key into `SUPABASE_SECRET_KEY=` in `.env`. The legacy service role key can be used in `SUPABASE_SERVICE_ROLE_KEY=` instead. Use only one backend key.
3. Leave the prefilled `STAFF_USER_ID=` value intact.
4. Set a strong private `STAFF_PASSWORD=` for the local dashboard. It is separate from the Supabase Auth password.
5. `SESSION_SECRET=` is optional for the local demo. If it is missing or too short, the launcher creates a private persistent `.session_secret` file automatically. Keep that file private. The local `WORKFLOW_TOKEN=` is only for the optional local endpoint; the online n8n scheduler uses a separate private token stored as an n8n credential and only its SHA-256 hash in Supabase Edge Function secrets.
6. Never share `.env`, a password, or an API key in chat, GitHub, browser code, or the exported n8n workflow.

## 4. Check the connection and start the app

From the `admitcrew` folder in PowerShell, run the connection check once:

```powershell
py setup_check.py
```

The preflight should find 15 active programs, three test leads, and the active staff membership. After that, **double-click `Open-AdmitCrew.bat`** in File Explorer whenever you want to use the website. Your browser opens `http://127.0.0.1:8765/` automatically. The staff dashboard is at `http://127.0.0.1:8765/staff`; sign in with the local `STAFF_PASSWORD`. Keep the launcher window open while using the website. This is a local address on your own computer, not a publicly hosted website.

When updating from an older extracted folder, close its running server window first, then launch the new folder. The launcher detects an older server on the same port and asks you to close it instead of opening an outdated design.

## 5. Run the seven live cases

Keep the app running and double-click `Run-AdmitCrew-Tests.bat` from the same folder. It runs the focused checks followed by the seven local API checks with fake test data:

| Case | Expected result |
| --- | --- |
| T01 | A returning phone creates one lead and two conversations |
| T02 | Manchester, Leeds, and Toronto answers match the stored fee, deadline, and minimum requirements; staff approves the local replies |
| T03 | An unlisted university is escalated to staff; an unrelated weather question receives a polite refusal |
| T04 | The instruction trick receives no admission promise |
| T05 | Fake expired Passport B produces `problem / expired`, visible to staff |
| T06 | Hamza's reminder stays pending before approval and is delivered only once afterward |
| T07 | The dashboard shows leads, chats, documents, outgoing messages, and audit history |

On the first run, Hamza's pending reminder is approved and sent once. On repeat runs, the script checks the existing staff approval and single delivery and labels T06 `HISTORY PASS`; this cannot replay the pending state. The video must show a genuine pending state and staff approval from the first run or a separately prepared isolated test environment. Never claim that a repeat run displayed the pending state live.

## 6. Online n8n scheduler

The deployed Edge Function URL is `https://bxzjunrthbdmicqwgzeh.supabase.co/functions/v1/admitcrew-reminders`. The accompanying database RPC is executable only by `service_role`. The Edge Function rejects all requests until its SHA-256 token digest is configured. It creates pending reminder drafts only.

1. Generate a private random token locally and compute its lowercase SHA-256 hex digest. Keep the original token private; do not paste it in chat or in the workflow JSON.
2. In Supabase **Edge Functions → Secrets**, set `WORKFLOW_TOKEN_SHA256` to the 64-character digest. Do not set the original token there.
3. In the n8n HTTP Request node, set Method `POST` and URL to the HTTPS Edge Function URL above. Choose `Generic Credential Type` → `Header Auth`, with credential name `X-Workflow-Token` and value the original token. Do not put a Supabase backend key in n8n.
4. Save the workflow inactive. Run the Manual Test trigger once and confirm it created only a pending draft in the staff dashboard; then activate the six-hour schedule.

If you already imported an older JSON file with a `127.0.0.1` URL, edit its node URL to the HTTPS Edge Function URL. Online n8n cannot call your computer's localhost address.

## 7. Demo video

Record the student chat and staff dashboard. Show T01 through T07, the practice program rows, fake document results, Hamza's pending reminder, staff approval, and the single local delivery. Keep `.env`, passwords, and API keys out of the recording.

## Current status

The local practice tests pass; T06 is a history check. The updated integration code is not activated in the operator’s older Windows folder until these new files are copied there. Real Meta delivery, individual staff accounts and OpenAI access require the office’s own credentials and live checks. See `PRODUCTION_SETUP.md`.
