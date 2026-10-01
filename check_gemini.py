"""Private connectivity check: prints status, never API keys or provider error bodies."""
import json
import urllib.request
import urllib.error
import urllib.parse
import app
if not app.GEMINI_API_KEY:
    print('Gemini key set: False')
    raise SystemExit(1)
print('Gemini key set: True')
model=urllib.parse.quote(app.GEMINI_MODEL,safe='')
payload={'contents':[{'parts':[{'text':'Reply with exactly: GEMINI_OK'}]}],'generationConfig':{'maxOutputTokens':100}}
req=urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','x-goog-api-key':app.GEMINI_API_KEY})
try:
    with urllib.request.urlopen(req,timeout=25) as response:
        result=json.load(response)
    texts=' '.join(p.get('text','') for c in result.get('candidates',[]) for p in c.get('content',{}).get('parts',[]) if not p.get('thought'))
    print('Gemini live response:',bool(texts.strip()))
except urllib.error.HTTPError as exc:
    print('Gemini HTTP status:',exc.code)
    print('Check API access/model for 400 or 404, key permissions for 403, free quota for 429.')
    raise SystemExit(1)
except (urllib.error.URLError,TimeoutError,ValueError):
    print('Gemini connection failed. Check internet and retry.')
    raise SystemExit(1)
