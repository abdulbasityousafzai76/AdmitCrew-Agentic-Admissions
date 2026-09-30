"""Create visibly fake, text-readable PDFs for the assignment's document tests."""
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen.canvas import Canvas

ROOT = Path(__file__).resolve().parent / "fixtures"
ROOT.mkdir(exist_ok=True)
DOCUMENTS = [
    ("passport_a.pdf", "PASSPORT A", ["Name: Ali Khan", "Expires: 10 Mar 2030"]),
    ("passport_b_expired.pdf", "PASSPORT B", ["Name: Ali Khan", "Expires: 1 Jan 2025"]),
    ("transcript_name_mismatch.pdf", "TRANSCRIPT", ["Name: Ali Ahmed", "Marks: 78%"]),
    ("ielts_ayesha.pdf", "IELTS RESULT", ["Name: Ayesha Noor", "Overall: 7.0"]),
]
for filename, title, lines in DOCUMENTS:
    path = ROOT / filename
    pdf = Canvas(str(path), pagesize=letter)
    pdf.setFont("Helvetica-Bold", 28); pdf.drawString(55, 710, "TEST DOCUMENT")
    pdf.setFont("Helvetica-Bold", 16); pdf.drawString(55, 660, title)
    pdf.setFont("Helvetica", 13)
    for index, line in enumerate(lines): pdf.drawString(55, 610-index*32, line)
    pdf.setFont("Helvetica", 11); pdf.drawString(55, 470, "NOT VALID FOR IDENTIFICATION OR ADMISSION")
    pdf.save()
    print(path)
