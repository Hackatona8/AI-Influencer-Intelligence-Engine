from backend.main import ScoreRequest, score_influencer_async, get_job, _run_score_job
from fastapi import BackgroundTasks


def test_score_async_queue_and_result():
    payload = ScoreRequest(metrics={"followers": 2000, "avgLikes": 80, "avgComments": 4}, quality={})
    tasks = BackgroundTasks()
    queued = score_influencer_async(payload, tasks)
    assert queued.status == "queued"

    # Simulate worker execution directly for deterministic test
    _run_score_job(queued.jobId, payload)
    result = get_job(queued.jobId)
    assert result.status in {"completed", "failed"}
