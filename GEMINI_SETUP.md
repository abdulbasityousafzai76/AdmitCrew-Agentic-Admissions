# Gemini demo integration
Copy app.py and check_gemini.py into your existing project, replacing app.py only. Keep your private .env.

Add to .env:
```
GEMINI_API_KEY=your_private_key
GEMINI_MODEL=gemini-2.5-flash-lite
```
Leave OPENAI_API_KEY blank to avoid the exhausted provider. No new Python packages are needed.
Run `python check_gemini.py` before restarting `python app.py`. A live response True verifies the provider only; then test a Manchester question, inspect the pending draft and approve it in the staff dashboard.

Gemini takes priority when its key is set. It receives only practice university answer text, not the student's question, identity or documents. This is optional wording for a matched university answer, not LLM intake or OCR. Existing exact factual-clause checks remain. Failed/changed output falls back to the database answer. Approval and external delivery settings are unchanged. Free quota can run out; do not enable paid billing for this free demo.

Google's free tier may use inputs/outputs for product improvement. Use fake demo data only.
Sources: https://ai.google.dev/api/generate-content and https://ai.google.dev/gemini-api/docs/pricing

24 offline tests pass, including mocked Gemini acceptance, changed-fee rejection, empty response and provider failure. A real key was not available in the build environment; live verification must run on your PC.
