// Supabase Edge Function: admitcrew-reminders
// Configure WORKFLOW_TOKEN_SHA256 in Edge Function secrets before invoking.
const reply = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const expected = Deno.env.get("WORKFLOW_TOKEN_SHA256")?.trim().toLowerCase();
  if (!expected || !/^[0-9a-f]{64}$/.test(expected)) {
    return reply({ error: "Workflow is not configured" }, 503);
  }
  const token = request.headers.get("X-Workflow-Token") ?? "";
  if (token.length < 32 || token.length > 256) return reply({ error: "Unauthorized" }, 401);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  const target = Uint8Array.from(expected.match(/.{2}/g)!, (byte) => parseInt(byte, 16));
  let mismatch = 0;
  for (let i = 0; i < digest.length; i++) mismatch |= digest[i] ^ target[i];
  if (mismatch) return reply({ error: "Unauthorized" }, 401);

  const baseUrl = Deno.env.get("SUPABASE_URL");
  const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secretKey = keys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!baseUrl || !secretKey) return reply({ error: "Backend is not configured" }, 503);
  try {
    const result = await fetch(`${baseUrl}/rest/v1/rpc/create_reminder_drafts`, {
      method: "POST",
      headers: { apikey: secretKey, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!result.ok) {
      console.error("Reminder RPC failed", result.status);
      return reply({ error: "Reminder draft creation failed" }, 502);
    }
    const created = await result.json();
    return reply({ created }, 200);
  } catch {
    return reply({ error: "Backend is unavailable" }, 503);
  }
});
