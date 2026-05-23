FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV NONVERBAL_INFERENCE_HOST=0.0.0.0
ENV NONVERBAL_INFERENCE_PORT=8765

WORKDIR /app

RUN pip install --no-cache-dir joblib pandas scikit-learn

COPY ml/nonverbal/inference_service.py ml/nonverbal/inference_service.py
COPY ml/nonverbal/models/nonverbal_rf.joblib ml/nonverbal/models/nonverbal_rf.joblib
COPY ml/nonverbal/models/feature_schema.json ml/nonverbal/models/feature_schema.json

EXPOSE 8765

CMD ["python", "ml/nonverbal/inference_service.py"]
