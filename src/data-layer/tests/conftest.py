import os
import sys
from pathlib import Path

import pytest
import requests
import yaml
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(Path(__file__).resolve().parent))
from constants import TEST_HOST

GLOBALS_YAML = {}

BOOTSTRAP_ADMIN_EMAIL = "bootstrap-admin@nextjudge.test"
BOOTSTRAP_ADMIN_PASSWORD = "test-bootstrap-admin-password"

def safe_json_list(response: requests.Response) -> list:
    if response.status_code != 200:
        return []
    data = response.json()
    return data if isinstance(data, list) else []

def ensure_admin_token(host: str) -> str:
    login = requests.post(
        f"{host}/v1/basic_login",
        json={"email": BOOTSTRAP_ADMIN_EMAIL, "password": BOOTSTRAP_ADMIN_PASSWORD},
        timeout=10,
    )
    if login.status_code == 200:
        return login.json()["token"]

    register = requests.post(
        f"{host}/v1/basic_register",
        json={
            "name": "bootstrap_admin",
            "email": BOOTSTRAP_ADMIN_EMAIL,
            "password": BOOTSTRAP_ADMIN_PASSWORD,
        },
        timeout=10,
    )
    if register.status_code != 200:
        raise RuntimeError(f"failed to bootstrap admin user: {register.status_code} {register.text}")
    return register.json()["token"]

@pytest.fixture(scope="session")
def host():
    return os.environ.get("TAVERN_HOST", TEST_HOST)

@pytest.fixture(scope="session", autouse=True)
def tavern_global_vars(host: str):
    global GLOBALS_YAML

    with open("./tests/globals.yaml") as f:
        GLOBALS_YAML = yaml.safe_load(f)["variables"]

    GLOBALS_YAML["host"] = host
    GLOBALS_YAML["admin_token"] = ensure_admin_token(host)
    return GLOBALS_YAML

@pytest.fixture(scope="session", autouse=True)
def setup_tests(tavern_global_vars: dict):
    admin_headers = {"Authorization": tavern_global_vars["admin_token"]}
    host = tavern_global_vars["host"]
    test_users = [tavern_global_vars["test_username"], tavern_global_vars["test_username_2"]]
    for u in test_users:
        endpoint = host + "/v1/users"
        r = requests.get(endpoint, params={"name": u}, headers=admin_headers, timeout=10)

        if r.status_code != 404 and len(safe_json_list(r)) > 0:
            userId = r.json()[0]['id']
            endpoint = endpoint + "/" + str(userId)
            r = requests.delete(endpoint, headers=admin_headers, timeout=10)
            if r.status_code != 204:
                raise RuntimeError("error deleting test user")

    endpoint = host + "/v1/problems"
    r = requests.get(endpoint, headers=admin_headers, timeout=10)
    for p in safe_json_list(r):
        if p['title'] == tavern_global_vars["test_problem"]:
            endpoint = endpoint + "/" + str(p['id'])
            r = requests.delete(endpoint, headers=admin_headers, timeout=10)
            if r.status_code != 204:
                raise RuntimeError("error deleting test problem")
            break

    endpoint = host + "/v1/languages"
    r = requests.get(endpoint, timeout=10)
    for l in safe_json_list(r):
            if l['name'] == tavern_global_vars["test_language"]:
                endpoint = endpoint + "/" + str(l['id'])
                r = requests.delete(endpoint, headers=admin_headers, timeout=10)
                if r.status_code != 204:
                    raise RuntimeError("error deleting test language")
                break

@pytest.fixture(scope="session", autouse=True)
def five_minutes_from_now():
  time = datetime.now(timezone.utc) + timedelta(minutes = 5)
  return time.strftime('%Y-%m-%dT%H:%M:%SZ')

@pytest.fixture(scope="session", autouse=True)
def five_minutes_ago():
  time = datetime.now(timezone.utc) + timedelta(minutes = -5)
  return time.strftime('%Y-%m-%dT%H:%M:%SZ')

@pytest.fixture(scope="session", autouse=True)
def ten_minutes_from_now():
  time = datetime.now(timezone.utc) + timedelta(minutes = 10)
  return time.strftime('%Y-%m-%dT%H:%M:%SZ')
