from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "ml" / "nonverbal" / "models" / "nonverbal_rf.joblib"
SCHEMA_PATH = ROOT / "ml" / "nonverbal" / "models" / "feature_schema.json"


class NonverbalModel:
    def __init__(self) -> None:
        self.schema = json.loads(SCHEMA_PATH.read_text())
        self.model = joblib.load(MODEL_PATH)
        self.feature_order: list[str] = self.schema["featureOrder"]
        self.model_name: str = self.schema["modelName"]
        self.model_version: str = self.schema["modelVersion"]

    def predict(self, features: dict[str, Any]) -> dict[str, Any]:
        missing = [name for name in self.feature_order if name not in features]
        if missing:
            raise ValueError(f"Missing non-verbal features: {', '.join(missing)}")

        row: dict[str, float] = {}
        for name in self.feature_order:
            value = features[name]
            if not isinstance(value, (int, float)):
                raise ValueError(f"Feature {name} must be numeric.")
            row[name] = float(value)

        frame = pd.DataFrame([row], columns=self.feature_order)
        raw_score = float(self.model.predict(frame)[0])
        score = round(max(0.0, min(1.0, raw_score)) * 100)

        return {
            "nonverbalScore": score,
            "nonverbalModelName": self.model_name,
            "nonverbalModelVersion": self.model_version,
        }


MODEL = NonverbalModel()


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path != "/health":
            json_response(self, 404, {"error": "Not found."})
            return

        json_response(
            self,
            200,
            {
                "status": "ok",
                "modelName": MODEL.model_name,
                "modelVersion": MODEL.model_version,
            },
        )

    def do_POST(self) -> None:
        if self.path != "/predict":
            json_response(self, 404, {"error": "Not found."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length) or b"{}")
            features = payload.get("features")
            if not isinstance(features, dict):
                raise ValueError("Request body must include a features object.")

            json_response(self, 200, MODEL.predict(features))
        except Exception as exc:
            json_response(self, 400, {"error": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:
        if os.getenv("NONVERBAL_INFERENCE_LOGS") == "1":
            super().log_message(format, *args)


def main() -> None:
    host = os.getenv("NONVERBAL_INFERENCE_HOST", "127.0.0.1")
    port = int(os.getenv("NONVERBAL_INFERENCE_PORT", "8765"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Intervue non-verbal inference listening on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
