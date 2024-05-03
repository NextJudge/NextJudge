import pytest
import requests
import yaml
import random
import string
import os
from requests_oauthlib import OAuth2Session
from oauthlib.oauth2 import BackendApplicationClient
from datetime import datetime, timedelta


GLOBALS_YAML = {}

@pytest.fixture(scope="session", autouse=True)
def setup_tests():
    global GLOBALS_YAML, CUR_HOST

    f = open("./tests/globals.yaml")
    GLOBALS_YAML = yaml.safe_load(f)["variables"]
    f.close()

    endpoint = GLOBALS_YAML["host"] + "/v1/users"
    r = requests.get(endpoint, params={
        "username": GLOBALS_YAML["test_username"]
    })

    if r.status_code != 404 and len(r.json()) > 0:
        userId = r.json()[0].ID 
        endpoint = endpoint + "/" + str(userId)
        r = requests.delete(endpoint)
        if r.status_code != 204:
            raise RuntimeError("error deleting test user")

