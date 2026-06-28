import tomllib
from dataclasses import dataclass
from pathlib import Path

LANGUAGES_TOML_PATH = Path(__file__).resolve().parent.parent / "languages.toml"


@dataclass
class Language:
    name: str
    script: str
    extension: str
    id: int


LOCAL_LANGUAGES: list[Language] = []
LOCAL_LANGUAGES_MAP: dict[int, Language] = {}
BRIDGE_LANG_ID_MAP: dict[str, int] = {}


def parse_languages() -> None:
    language_data = tomllib.load(open(LANGUAGES_TOML_PATH, "rb"))

    lang_id = 0
    for supported_lang in language_data["language"]:
        LOCAL_LANGUAGES.append(
            Language(
                supported_lang["name"],
                supported_lang["script"],
                supported_lang["extension"],
                lang_id,
            )
        )
        lang_id += 1

    for lang in LOCAL_LANGUAGES:
        LOCAL_LANGUAGES_MAP[lang.id] = lang


def get_language(local_language_id: int) -> Language | None:
    for lang in LOCAL_LANGUAGES:
        if lang.id == local_language_id:
            return lang
    return None


def get_language_by_extension(ext: str) -> Language | None:
    for lang in LOCAL_LANGUAGES:
        if lang.extension == ext:
            return lang
    return None
