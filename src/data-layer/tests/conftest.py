import pytest
import requests
import yaml
from datetime import datetime, timedelta, timezone

GLOBALS_YAML = {}

@pytest.fixture(scope="session", autouse=True)
def setup_tests():
    global GLOBALS_YAML, CUR_HOST

    f = open("./tests/globals.yaml")
    GLOBALS_YAML = yaml.safe_load(f)["variables"]
    f.close()

    test_users = [GLOBALS_YAML["test_username"], GLOBALS_YAML["test_username_2"]]
    for u in test_users: 
        endpoint = GLOBALS_YAML["host"] + "/v1/users"
        r = requests.get(endpoint, params={
            "name": u
        })

        if r.status_code != 404 and len(r.json()) > 0:
            userId = r.json()[0]['id']
            endpoint = endpoint + "/" + str(userId)
            r = requests.delete(endpoint)
            if r.status_code != 204:
                raise RuntimeError("error deleting test user")
    
    endpoint = GLOBALS_YAML["host"] + "/v1/problems"
    r = requests.get(endpoint)
    if len(r.json()) > 0:
        problems = r.json()
        for p in problems:
            if p['title'] == GLOBALS_YAML["test_problem"]:
                endpoint = endpoint + "/" + str(p['id'])
                r = requests.delete(endpoint)
                if r.status_code != 204:
                    raise RuntimeError("error deleting test problem")
                break
                
    endpoint = GLOBALS_YAML["host"] + "/v1/languages"
    r = requests.get(endpoint)
    if len(r.json()) > 0:
        languages = r.json()
        for l in languages:
            if l['name'] == GLOBALS_YAML["test_language"]:
                endpoint = endpoint + "/" + str(l['id'])
                r = requests.delete(endpoint)
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