import pytest
from src.app import *
from pathlib import Path

@pytest.fixture
def setup():
    parse_languages()
    yield
    
@pytest.mark.parametrize("input_file_name", os.listdir(os.path.join(os.path.dirname(__file__), "test_hello_world")))
def test_c(setup, input_file_name):
    file_path = os.path.join("test_hello_world", input_file_name)
    extension = Path(file_path).suffix[1:]
    assert extension
    lang = get_language_by_extension(extension)

    assert lang != None

    with open(os.path.join(os.path.dirname(__file__),file_path), 'r') as file:
        source_code = file.read() 
        assert simple_compile_and_run(source_code, lang) == b"Hello world!\n"