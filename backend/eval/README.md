# Evaluation Suite

This folder contains model validation utilities for the Ratefluencer scorer.

## What it computes
- `RMSE` (root mean squared error)
- `MAE` (mean absolute error)
- `R2` score
- `MAPE` (mean absolute percentage error)

## Run

From the repository root:

```bash
python -m backend.eval.run_eval
```

Output report:
- `backend/eval/reports/latest.json`
