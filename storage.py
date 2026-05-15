import json
import os

try:
    import redis
except ImportError:
    redis = None

KV_URL = os.environ.get("KV_REST_API_URL") or os.environ.get("REDIS_URL")
CAMPAIGNS_KEY = "tm:campaigns"

_local_file = os.path.join(os.path.dirname(__file__), "campaigns.json")


def _get_redis():
    if not KV_URL or not redis:
        return None
    return redis.from_url(KV_URL, decode_responses=True)


def load_campaigns():
    r = _get_redis()
    if r:
        data = r.get(CAMPAIGNS_KEY)
        return json.loads(data) if data else []
    if os.path.exists(_local_file):
        with open(_local_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_campaigns(campaigns):
    r = _get_redis()
    if r:
        r.set(CAMPAIGNS_KEY, json.dumps(campaigns, ensure_ascii=False))
    else:
        with open(_local_file, "w", encoding="utf-8") as f:
            json.dump(campaigns, f, ensure_ascii=False, indent=2)
