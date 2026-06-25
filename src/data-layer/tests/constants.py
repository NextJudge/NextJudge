import os

# Ephemeral local stack — must match docker-compose.test.yml host port mapping.
TEST_PORT = int(os.environ.get("DATA_LAYER_TEST_PORT", "5050"))
TEST_HOST = os.environ.get("TAVERN_HOST", f"http://127.0.0.1:{TEST_PORT}")
