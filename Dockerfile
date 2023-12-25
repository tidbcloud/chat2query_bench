# syntax=docker/dockerfile:1

FROM python:3.12
WORKDIR /app
COPY . .

RUN groupadd -r app && useradd -r -g app app && mkdir -p /home/app && chown -R app:app /app && chown -R app:app /home/app
USER app
RUN pip install -r requirements.txt && python3 nltk_downloader.py
