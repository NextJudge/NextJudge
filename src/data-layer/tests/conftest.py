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

    test_users = [GLOBALS_YAML["test_username"], GLOBALS_YAML["test_username_2"]]
    for u in test_users: 
        endpoint = GLOBALS_YAML["host"] + "/v1/users"
        r = requests.get(endpoint, params={
            "username": u
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
