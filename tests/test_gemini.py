import unittest
from unittest.mock import patch
import app

ANSWER='Practice data for University of Manchester — BSc Computer Science: fee £32,000 per year; deadline 2027-01-15; minimum marks 75%; minimum IELTS 6.5; documents: Passport, transcript, IELTS. Meeting these minimums does not guarantee admission. Staff will confirm current official information.'
class GeminiRules(unittest.TestCase):
    def run_answer(self, result):
        with patch.object(app,'GEMINI_API_KEY','fake-test-key'), patch.object(app,'json_request',return_value=result) as request:
            answer=app.ai_polish_answer(ANSWER,'PRIVATE STUDENT TEXT')
            self.assertNotIn('PRIVATE STUDENT TEXT',str(request.call_args))
            return answer
    def test_valid_response(self):
        self.assertEqual(self.run_answer({'candidates':[{'content':{'parts':[{'text':ANSWER}]}}]}),ANSWER)
    def test_altered_fee_rejected(self):
        self.assertEqual(self.run_answer({'candidates':[{'content':{'parts':[{'text':ANSWER.replace('£32,000','£1')}]}}]}),ANSWER)
    def test_empty_response_falls_back(self):
        self.assertEqual(self.run_answer({}),ANSWER)
    def test_provider_failure_falls_back(self):
        with patch.object(app,'GEMINI_API_KEY','fake'),patch.object(app,'json_request',side_effect=app.AppError('Unavailable')):
            self.assertEqual(app.ai_polish_answer(ANSWER,'test'),ANSWER)
