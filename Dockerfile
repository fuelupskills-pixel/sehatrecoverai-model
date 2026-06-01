FROM python:3.10-slim

WORKDIR /app

# Install dependencies first for better caching
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend and static directories
COPY backend/ ./backend/
COPY static/ ./static/
COPY sehatrecover.db ./

# Expose the FastAPI port
EXPOSE 8000

# Start the application
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
