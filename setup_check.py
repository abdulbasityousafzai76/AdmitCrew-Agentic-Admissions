"""Read-only preflight for the local AdmitCrew demo; never prints secrets."""
import sys

import app


def main():
    checks = {
        "Supabase project URL": app.PROJECT_URL.endswith("bxzjunrthbdmicqwgzeh.supabase.co"),
        "Server-only Supabase key": bool(app.SERVICE_KEY),
        "Staff login settings": (bool(app.STAFF_USER_ID and app.STAFF_PASSWORD) if app.STAFF_AUTH_MODE == "legacy"
                                 else bool(app.SUPABASE_PUBLISHABLE_KEY) if app.STAFF_AUTH_MODE == "supabase" else False),
        "Session secret (32+ characters)": len(app.SESSION_SECRET) >= 32,
    }
    for name, okay in checks.items():
        print(f"{'OK' if okay else 'MISSING'}  {name}")
    if not all(checks.values()):
        print("Complete the private .env file before the live tests. Never share its keys in chat.")
        return 1
    try:
        programs = app.programs()
        staff = (app.lookup("staff_members", [app.filter_eq("user_id", app.STAFF_USER_ID), "active=eq.true"])
                 if app.STAFF_AUTH_MODE == "legacy" else app.lookup("staff_members", ["active=eq.true"]))
        leads = app.lookup("leads", ["is_test=eq.true"])
    except app.AppError as exc:
        print(f"Database check failed: {exc}")
        return 1
    print(f"Database records: {len(programs)} active programs, {len(leads)} test leads")
    print(f"Staff membership: {'active' if staff else 'MISSING'}")
    return 0 if len(programs) >= 15 and len(leads) >= 3 and staff else 1


if __name__ == "__main__":
    sys.exit(main())
