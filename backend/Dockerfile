FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc default-libmysqlclient-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python scripts/seed_admin.py && python scripts/seed_stars.py && python scripts/import_catalog_stars.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
