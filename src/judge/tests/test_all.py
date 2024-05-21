import pytest
from src.app import *
from pathlib import Path

@pytest.fixture
def setup():
    parse_languages()
    yield

@pytest.mark.parametrize("input_file_name", os.listdir(os.path.join(os.path.dirname(__file__), "test_hello_world")))
def test_run(setup, input_file_name):
    file_path = os.path.join("test_hello_world", input_file_name)
    extension = Path(file_path).suffix[1:]
    assert extension
    lang = get_language_by_extension(extension)

    assert lang != None

    with open(os.path.join(os.path.dirname(__file__),file_path), 'r') as file:
        source_code = file.read() 
        assert simple_compile_and_run(source_code, lang).stdout == b"Hello world!\n"

@pytest.mark.parametrize("input_file_name", os.listdir(os.path.join(os.path.dirname(__file__), "test_compile_error")))
def test_compile_error(setup, input_file_name):
    file_path = os.path.join("test_compile_error", input_file_name)
    extension = Path(file_path).suffix[1:]
    assert extension
    lang = get_language_by_extension(extension)

    assert lang != None

    with open(os.path.join(os.path.dirname(__file__),file_path), 'r') as file:
        source_code = file.read() 
        assert simple_compile_and_run(source_code, lang).result == "COMPILE_TIME_ERROR"

@pytest.mark.parametrize("input_file_name", os.listdir(os.path.join(os.path.dirname(__file__), "test_runtime_error")))
def test_runtime_error(setup, input_file_name):
    file_path = os.path.join("test_runtime_error", input_file_name)
    extension = Path(file_path).suffix[1:]
    assert extension
    lang = get_language_by_extension(extension)

    assert lang != None

    with open(os.path.join(os.path.dirname(__file__),file_path), 'r') as file:
        source_code = file.read() 
        assert simple_compile_and_run(source_code, lang).result == "RUNTIME_ERROR"

