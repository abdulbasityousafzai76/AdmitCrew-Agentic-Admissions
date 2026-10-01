# Deploy AdmitCrew on Render

These files prepare deployment; they do not mean the website is already live.

1. Copy this package's files into the root of your existing GitHub repository. Commit and push in GitHub Desktop. Never copy your private `.env` into GitHub.
2. Open https://dashboard.render.com/ and sign in using GitHub.
3. Choose **New → Blueprint**, connect `AdmitCrew-Agentic-Admissions`, and select `render.yaml` from the main branch.
4. Enter `SUPABASE_SECRET_KEY` and `SUPABASE_PUBLISHABLE_KEY` in Render's private configuration form. Use your current keys from your local `.env`; do not share them in chat. Revoke any previously exposed secret keys.
5. Confirm the service uses the **Free** plan and deploy. No paid database is added; the app uses the existing Supabase database.
6. Wait for **Live**. Render supplies the actual website URL. The student page is `/`, and the staff page is `/staff`. Staff sign in with their existing Supabase accounts.
7. Check `/health`, staff login, saved leads, chat drafts, approvals, and both PDF/image fake document checks on the deployed site.

The container installs Python PDF/image packages and Tesseract for OCR. HTTPS cookies are enabled in Render; local HTTP use retains its existing cookie behavior.

Render Free sleeps after 15 minutes without traffic; waking can take approximately one minute. It is suitable for this demonstration, not uninterrupted day/night service. Lead, conversation, document result and approval records stay in Supabase. Uploaded fake document files are local and are lost on sleep, restart or redeployment. Do not use real student documents.

OpenAI remains optional: add `OPENAI_API_KEY` privately in Render only when your API account can make successful requests. Without it the database-backed answer fallback remains active. Meta sending remains disabled until its separate setup is completed. Your local n8n workflow does not automatically move to Render; configure its authenticated reminder HTTP request to use the deployed origin and Render's `WORKFLOW_TOKEN` when needed. Reminders remain drafts until staff approval.

If a build fails, open Render's deployment logs and share only the error text, with secrets hidden.
