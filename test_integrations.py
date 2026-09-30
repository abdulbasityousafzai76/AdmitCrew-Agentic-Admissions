import hashlib
import hmac
import io
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app
import meta_channels


class IntegrationRules(unittest.TestCase):
    def test_fake_expired_passport_image_uses_ocr(self):
        image = (Path(__file__).resolve().parents[1] / "fixtures/passport_b_expired.png").read_bytes()
        text = app.image_text(image)
        self.assertIn("TEST DOCUMENT", text)
        self.assertEqual(app.document_result(text, "passport", {"full_name": "Ali Khan"})[:2], ("problem", "expired"))

    def test_meta_signature_cannot_be_forged(self):
        body = b'{"object":"page"}'
        valid = "sha256=" + hmac.new(b"private-test-secret", body, hashlib.sha256).hexdigest()
        self.assertTrue(meta_channels.verify_signature(body, valid, "private-test-secret"))
        self.assertFalse(meta_channels.verify_signature(body + b" ", valid, "private-test-secret"))

    def test_individual_staff_login_requires_active_membership(self):
        with patch.object(app, "SUPABASE_PUBLISHABLE_KEY", "test-publishable"), \
             patch.object(app, "PROJECT_URL", "https://test.supabase.co"), \
             patch.object(app, "json_request", return_value={"user": {"id": "user-1"}}), \
             patch.object(app, "lookup", return_value=[]):
            with self.assertRaises(app.AppError):
                app.authenticate_staff("staff@example.com", "test-password")

    def test_external_reply_blocks_without_enabled_delivery(self):
        with patch.object(app, "EXTERNAL_DELIVERY_ENABLED", False):
            with self.assertRaises(app.AppError):
                app.external_delivery_ready({"channel": "whatsapp", "kind": "university_answer"})

    def test_unapproved_external_draft_cannot_send(self):
        draft = {"status": "pending_approval", "channel": "whatsapp"}
        with patch.object(app, "lookup", return_value=[draft]), patch.object(meta_channels, "send_text") as send:
            with self.assertRaises(app.AppError):
                app.deliver_external("draft-id")
            send.assert_not_called()

    def test_whatsapp_payload_uses_verified_recipient(self):
        class FakeResponse(io.BytesIO):
            def __enter__(self): return self
            def __exit__(self, *args): self.close()
        captured = []
        def fake_open(request, timeout):
            captured.append(json.loads(request.data))
            return FakeResponse(b'{"messages":[{"id":"provider-123"}]}')
        with patch.dict("os.environ", {"WHATSAPP_PHONE_NUMBER_ID":"phone-id", "WHATSAPP_ACCESS_TOKEN":"private-test-token"}), \
             patch.object(meta_channels.urllib.request, "urlopen", side_effect=fake_open):
            self.assertEqual(meta_channels.send_text("whatsapp", "+923001112222", "Approved reply"), "provider-123")
        self.assertEqual(captured[0]["to"], "923001112222")
        self.assertEqual(captured[0]["text"]["body"], "Approved reply")


if __name__ == "__main__":
    unittest.main()
