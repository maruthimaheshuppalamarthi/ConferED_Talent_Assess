"""
Request / response models for the settings APIs, generated from the catalogue in core/default_settings.py.

For every group there is an ``<Group>SettingsUpdate`` model (all fields optional, unknown fields rejected,
strict types so ``true`` is never accepted for a number) and an ``<Group>SettingsOut`` model. The email group's
output never contains the SMTP password; it reports ``smtpPasswordSet`` / ``smtpPasswordSource`` instead.
"""
from typing import Annotated, Any, Dict, List, Literal, Optional, Type

from pydantic import BaseModel, ConfigDict, Field, StrictBool, create_model

from app.core.default_settings import GROUP_INFO, GROUPS, GROUP_EMAIL, SETTINGS_BY_GROUP


def _update_type(spec: Dict[str, Any]) -> Any:
    kind = spec["type"]
    if kind == "int":
        return Annotated[int, Field(strict=True, ge=spec["min"], le=spec["max"])]
    if kind == "bool":
        return StrictBool
    if kind == "enum":
        return Literal[tuple(spec["choices"])]
    min_length = 0 if spec["allow_empty"] else spec["min_length"]
    return Annotated[str, Field(strict=True, min_length=min_length, max_length=spec["max_length"])]


def _out_type(spec: Dict[str, Any]) -> Any:
    kind = spec["type"]
    if kind == "int":
        return int
    if kind == "bool":
        return bool
    if kind == "enum":
        return Literal[tuple(spec["choices"])]
    return str


def _build(group: str) -> tuple:
    title = group.capitalize()
    update_fields: Dict[str, Any] = {}
    out_fields: Dict[str, Any] = {}
    for spec in SETTINGS_BY_GROUP[group]:
        # (type, None): optional on input, but an explicit null is rejected because the type is not nullable
        update_fields[spec["key"]] = (_update_type(spec), Field(default=None, description=spec["description"]))
        if not spec["secret"]:
            out_fields[spec["key"]] = (_out_type(spec), Field(description=spec["description"]))
    if group == GROUP_EMAIL:
        out_fields["smtpPasswordSet"] = (bool, Field(description="A password is available (saved or from .env)"))
        out_fields["smtpPasswordSource"] = (
            Literal["database", "environment", "none"],
            Field(description="Where the password in use comes from"))
    update = create_model(f"{title}SettingsUpdate", __config__=ConfigDict(extra="forbid"), **update_fields)
    out = create_model(f"{title}SettingsOut", **out_fields)
    return update, out


UPDATE_MODELS: Dict[str, Type[BaseModel]] = {}
OUT_MODELS: Dict[str, Type[BaseModel]] = {}
for _group in GROUPS:
    UPDATE_MODELS[_group], OUT_MODELS[_group] = _build(_group)

AllSettingsOut = create_model("AllSettingsOut", **{g: (OUT_MODELS[g], ...) for g in GROUPS})


class EmailTestRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    to: Optional[str] = Field(default=None, max_length=254,
                              description="Recipient. Defaults to your own 2FA email address.")


class EmailTestOut(BaseModel):
    ok: bool
    message: str
    sentTo: str
    host: str
    port: int
    sender: str
    passwordSource: Literal["database", "environment", "none"]


# ------------------------------------------------------------------ schema (lets the UI build its forms)
class SettingFieldOut(BaseModel):
    key: str
    label: str
    description: str
    type: Literal["int", "bool", "enum", "string"]
    min: Optional[int] = None
    max: Optional[int] = None
    choices: Optional[List[str]] = None
    secret: bool = False
    fmt: Optional[Literal["email", "hostname", "text"]] = None
    minLength: int = 0
    maxLength: int = 200
    allowEmpty: bool = False


class SettingsGroupSchema(BaseModel):
    group: str
    title: str
    description: str
    fields: List[SettingFieldOut]


class SettingsSchemaOut(BaseModel):
    groups: List[SettingsGroupSchema]


def _label(key: str) -> str:
    """'maxTabSwitches' -> 'Max tab switches'."""
    words = "".join(f" {c.lower()}" if c.isupper() else c for c in key).strip()
    return words[:1].upper() + words[1:]


def build_schema() -> SettingsSchemaOut:
    groups = []
    for group in GROUPS:
        title, blurb = GROUP_INFO[group]
        fields = [SettingFieldOut(
            key=s["key"], label=_label(s["key"]), description=s["description"], type=s["type"], min=s["min"],
            max=s["max"], choices=s["choices"], secret=s["secret"], fmt=s["fmt"], minLength=s["min_length"],
            maxLength=s["max_length"], allowEmpty=s["allow_empty"]) for s in SETTINGS_BY_GROUP[group]]
        groups.append(SettingsGroupSchema(group=group, title=title, description=blurb, fields=fields))
    return SettingsSchemaOut(groups=groups)
