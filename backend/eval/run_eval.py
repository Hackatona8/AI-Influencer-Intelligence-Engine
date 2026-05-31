from backend.eval.evaluate_ratefluencer import run_evaluation


if __name__ == "__main__":
    out = run_evaluation()
    print(f"Evaluation report written to: {out}")
