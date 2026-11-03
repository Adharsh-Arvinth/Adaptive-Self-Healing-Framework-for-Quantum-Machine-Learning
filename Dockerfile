FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY backend/ ./backend/
COPY benchmark_results/ ./benchmark_results/
COPY data/ ./data/

# Expose the port
ENV PORT=8000
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:${PORT}/health').raise_for_status()"

# Start the server
CMD uvicorn backend.api:app --host 0.0.0.0 --port ${PORT}
