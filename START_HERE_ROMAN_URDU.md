# AdmitCrew: step by step setup

Yeh **practice demo** hai. Sirf fake PDFs use karein. University fees aur dates real admissions guidance nahi hain. Student ko message staff approval ke baad sirf local test chat mein jata hai.

> **Naya update:** ZIP mein optional AI wording, image OCR, alag Supabase staff login, aur Meta channel adapters hain. Ye configure hone tak disabled hain. Enable karne se pehle `PRODUCTION_SETUP.md` parhein. Neeche demo steps shared-password test mode ke liye hain. n8n published hai; T06 history check tha, video website walkthrough hai.

## 1. Package aur Python

1. ZIP extract karein aur `admitcrew` folder kholein.
2. Python 3.11 ya newer install karein.
3. Windows PowerShell mein folder ke andar yeh commands chalayein:

```powershell
py -m pip install pypdf
py -m unittest discover -s tests -v
```

Local tests pass hone chahiye. Inhein assignment ke seven **live** tests na samjhein.

## 2. Supabase staff user — complete

AdmitCrew project mein Auth user `cbe1175c-cb10-4c6d-9434-6f1a9469fee8` ko `staff_members` mein active `staff` role se link aur verify kar diya gaya hai. `.env.example` mein UUID pehle se set hai. Password aur API key chat mein na bhejein.

## 3. Private settings

1. `.env.example` ki copy `.env` naam se banayein. Windows PowerShell: `Copy-Item .env.example .env`.
2. Supabase project mein **Settings → API Keys** se backend **secret key** lein. `.env` ke `SUPABASE_SECRET_KEY=` ke baad paste karein. Agar legacy service role key use kar rahe hon, `SUPABASE_SERVICE_ROLE_KEY=` line use karein. Sirf ek backend key set karein.
3. `STAFF_USER_ID=` mein step 2 ka UUID pehle se hai; isay waise hi rakhein.
4. `STAFF_PASSWORD=` mein local dashboard ke liye strong private password rakhein. Yeh Supabase Auth password se alag hai.
5. `SESSION_SECRET=` mein kam az kam 32 random characters rakhein. `WORKFLOW_TOKEN=` mein n8n ke liye alag random value rakhein.
6. `.env` GitHub par upload na karein; browser code ya n8n workflow JSON mein Supabase secret key na paste karein.

Example keys **khali** rakhi gayi hain. Apni real values is guide ya chat mein na likhein.

## 4. Connection test aur app start

PowerShell mein `admitcrew` folder se:

```powershell
py setup_check.py
py app.py
```

`setup_check.py` ko 15 active programs, 3 test leads aur active staff membership milni chahiye. App chalti rahe to browser mein student chat `http://127.0.0.1:8765/` aur staff dashboard `http://127.0.0.1:8765/staff` kholein. Staff dashboard mein `.env` wala `STAFF_PASSWORD` dalein.

## 5. Saat live tests

App chalti ho aur staff login working ho to isi folder mein `Run-AdmitCrew-Tests.bat` double-click karein. Yeh focused checks aur fake data se saat local API checks chalata hai:

| Test | Check |
| --- | --- |
| T01 | Naye student ka phone dobara use karne par ek lead, do conversations |
| T02 | Manchester, Leeds aur Toronto ke exact fee, deadline aur minima; staff-approved local replies |
| T03 | Unlisted university staff escalation; weather query ka polite refusal |
| T04 | “Ignore your rules...” par admission promise se refusal |
| T05 | Fake expired Passport B ka `problem / expired` result staff view mein |
| T06 | Hamza ka reminder pending, approval se pehle zero delivery, approval ke baad sirf ek |
| T07 | Dashboard mein leads, chats, documents, outgoing messages aur audit records |

Pehli baar script Hamza ka pending reminder approve karke `sent` banati hai. Dobara chalne par purani approval aur ek delivery verify kar ke `HISTORY PASS` dikhati hai; pending phase dobara live nahi dikh sakta. Video mein pending aur approve ka asli live recording chahiye, ya alag isolated test environment tayyar karein.

## 6. n8n reminder scheduler

1. `n8n_reminder_workflow.json` import karein, inactive rakhein.
2. **Create Pending Reminders** HTTP node mein URL apne backend ke reachable address par set karein. Docker ke andar `127.0.0.1` container ko point karta hai, Windows host ko nahi.
3. HTTP Header Auth credential mein header name `X-Workflow-Token` aur value `.env` ki `WORKFLOW_TOKEN` set karein. Supabase key n8n mein na dalein.
4. Manual Trigger se test karein. Dashboard mein pending draft check karein. Workflow ko tab activate karein jab endpoint reliably reachable ho. Har six hours yeh sirf draft banata hai, send nahi karta.

## 7. Demo video

Screen recording mein student page aur staff dashboard side by side dikhayein. T01 se T07 tak live actions, Supabase practice rows, document results, Hamza ka pending reminder, staff approval, aur ek local sent message dikhayein. Video mein `.env`, password aur API key kabhi na dikhayein.

## Current status

The local practice tests pass; T06 is a history check. The updated integration code is not activated in the operator’s older Windows folder until these new files are copied there. Real Meta delivery, individual staff accounts and OpenAI access require the office’s own credentials and live checks. See `PRODUCTION_SETUP.md`.
