# Intervue Non-Verbal ML Model

This workspace prepares a local non-verbal interview readiness model for Intervue. The primary model uses MediaPipe-derived visual features and a Random Forest regressor to predict the ChaLearn First Impressions V2 `interview` label as an interview readiness proxy.

The notebook can run in two modes:

```python
RUN_MODE = "smoke"  # 50 videos per split
RUN_MODE = "mvp"    # 300 videos per split
```

Start with `smoke`. After it succeeds, switch to `mvp` and rerun the notebook from the top.

## Setup

Create and activate the Conda environment:

```bash
conda env create -f ml/nonverbal/environment.yml
conda activate intervue-nonverbal-ml
python -m ipykernel install --user --name intervue-nonverbal-ml --display-name "Intervue Nonverbal ML"
```

Open `ml/nonverbal/nonverbal_model.ipynb` and select the `Intervue Nonverbal ML` kernel.

The environment pins `mediapipe==0.10.21` because the notebook uses the classic `mp.solutions.face_mesh` and `mp.solutions.pose` APIs.

## Dataset

Use ChaLearn First Impressions V2 videos and metadata from Hugging Face:

```text
yeray142/first-impressions-v2
```

The `interview` label is loaded from a public annotation mirror:

```text
https://raw.githubusercontent.com/zishansami102/First-Impression/master/annotation_training.pkl
https://raw.githubusercontent.com/zishansami102/First-Impression/master/annotation_validation.pkl
```

Videos are downloaded per selected file under:

```text
ml/nonverbal/data/raw/chalearn/
```

Raw videos are intentionally ignored by Git. Do not commit raw dataset files. By default, the notebook uses:

```python
DELETE_VIDEO_AFTER_EXTRACTION = True
```

This means each video is deleted after MediaPipe features are extracted. Metadata, annotations, processed features, metrics, and model artifacts are kept.

## Notebook Flow

The notebook is organized as:

1. Project Setup
2. Data Loading
3. Data Understanding
4. Feature Schema
5. MediaPipe Feature Extraction
6. Feature Validation
7. Model Training
8. Hyperparameter Tuning
9. Final Evaluation and Experiments
10. Classification Experiment
11. Evaluation Summary
12. Evaluation Visualizations
13. Export Model
14. Export Validation
15. Limitations

The exported production artifact remains the regressor. The notebook also trains a balanced Random Forest classifier as an experiment to compare categorical Macro F1, but that classifier is not the primary exported model.

The MVP inference pipeline uses the numeric regressor score only:

```text
Video -> MediaPipe features -> RandomForestRegressor -> nonverbal_score 0-100 -> LLM
```

Categorical labels are kept only as evaluation experiments:

```text
static_40_75    Legacy baseline: low < 40, medium 40-74, high >= 75
train_tertile   Analysis only: thresholds from train label quantiles 0.33 and 0.66
```

Do not use categorical labels as the MVP production output. Use `predicted_score_0_100` as the primary signal for the LLM.

## Expected Outputs After Running the Notebook

```text
ml/nonverbal/data/processed/chalearn_labeled_metadata.csv
ml/nonverbal/data/processed/chalearn_features.csv
ml/nonverbal/data/processed/export_validation_predictions.csv
ml/nonverbal/data/processed/model_comparison.csv
ml/nonverbal/models/nonverbal_rf.joblib
ml/nonverbal/models/feature_schema.json
ml/nonverbal/models/metrics.json
ml/nonverbal/models/experiment_metrics.json
ml/nonverbal/models/export_validation_predictions.csv
```

## Local Inference Snippet

After export, the model can be loaded directly:

```python
import json
import joblib
import pandas as pd

model = joblib.load("ml/nonverbal/models/nonverbal_rf.joblib")
schema = json.load(open("ml/nonverbal/models/feature_schema.json"))

features = pd.DataFrame([feature_row])[schema["featureOrder"]]
raw_score = model.predict(features)[0]
score_0_100 = round(max(0, min(1, raw_score)) * 100)
```

## Local Inference Service

The backend expects the non-verbal model to run as a local-only HTTP service:

```bash
conda activate intervue-nonverbal-ml
python ml/nonverbal/inference_service.py
```

The service exposes:

```text
GET  http://127.0.0.1:8765/health
POST http://127.0.0.1:8765/predict
```

`POST /predict` accepts a `features` object matching `feature_schema.json` and returns:

```json
{
  "nonverbalScore": 52,
  "nonverbalModelName": "nonverbal_interview_readiness_rf",
  "nonverbalModelVersion": "0.1.0"
}
```

The service is intended to run on the same home server as the backend. Do not expose it publicly.

## Notes

- The model only uses visual features extracted from video frames.
- The `interview` label comes from the GitHub annotation mirror, not directly from the Hugging Face dataset columns.
- The model does not use transcript text, gender, ethnicity, or age as features.
- The output is a proxy score for interview readiness, not a hiring decision.
- The MVP production output is the numeric score; labels are retained only for notebook analysis.
- The model does not infer real personality, emotion, or psychological confidence.
- Backend integration uses the local inference service. Frontend sends numeric MediaPipe features only; raw video should not be persisted.
