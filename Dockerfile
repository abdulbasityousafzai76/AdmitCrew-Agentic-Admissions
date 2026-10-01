FROM python:3.13-slim-bookworm
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 HOST=0.0.0.0 PORT=10000 TESSERACT_CMD=/usr/bin/tesseract
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home --uid 10001 admitcrew
COPY --chown=admitcrew:admitcrew app.py meta_channels.py ./
COPY --chown=admitcrew:admitcrew static ./static
RUN mkdir private_uploads && chown admitcrew:admitcrew private_uploads && chmod 700 private_uploads
USER admitcrew
EXPOSE 10000
CMD ["python", "app.py"]
