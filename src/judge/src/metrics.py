from prometheus_client import Counter, Gauge, Histogram

SUBMISSIONS_TOTAL = Counter(
    "judge_submissions_total",
    "Total submissions processed by the judge worker",
    ["type", "status"],
)
SUBMISSION_DURATION_SECONDS = Histogram(
    "judge_submission_duration_seconds",
    "Time spent judging a submission",
    ["type"],
)
ACTIVE_SUBMISSIONS = Gauge(
    "judge_active_submissions",
    "Number of submissions currently being judged",
)
