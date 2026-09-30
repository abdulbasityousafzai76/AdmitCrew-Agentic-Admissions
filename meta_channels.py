"""Minimal Meta Cloud API transport. Never call before staff approval."""
import hashlib
import hmac
import json
import os
import urllib.error
import urllib.request


class DeliveryError(Exception):
    def __init__(self, message, uncertain=False):
        super().__init__(message)
        self.uncertain = uncertain


def verify_signature(body, signature, app_secret):
    if not app_secret or not signature.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(app_secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)


def send_text(channel, recipient, body):
    if channel == "whatsapp":
        identifier = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        if not recipient.startswith("+") or not recipient[1:].isdigit():
            raise DeliveryError("WhatsApp recipient is not a verified phone number")
        path = identifier + "/messages"
        payload = {"messaging_product": "whatsapp", "to": recipient[1:], "type": "text", "text": {"body": body}}
    elif channel == "facebook":
        identifier = os.getenv("FACEBOOK_PAGE_ID", "")
        token = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")
        if not recipient.isdigit():
            raise DeliveryError("Facebook recipient is not a page-scoped ID")
        path = identifier + "/messages"
        payload = {"messaging_type": "RESPONSE", "recipient": {"id": recipient}, "message": {"text": body}}
    else:
        raise DeliveryError("Unsupported external channel")
    if not identifier or not token:
        raise DeliveryError("Meta channel credentials are not configured")
    version = os.getenv("META_GRAPH_VERSION", "v23.0")
    url = f"https://graph.facebook.com/{version}/{path}"
    request = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST",
                                     headers={"Content-Type": "application/json", "Authorization": "Bearer " + token})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            result = json.load(response)
    except urllib.error.HTTPError as exc:
        raise DeliveryError(f"Meta rejected message ({exc.code})") from None
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise DeliveryError("Meta delivery result is unknown", uncertain=True) from None
    messages = result.get("messages") or []
    message_id = messages[0].get("id") if channel == "whatsapp" and messages else result.get("message_id")
    if not message_id:
        raise DeliveryError("Meta delivery result is unknown", uncertain=True)
    return message_id
