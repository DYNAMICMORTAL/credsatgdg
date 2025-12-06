import json
import os
from typing import Any, Dict, List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
CONFIG_PATH = os.path.join(TEMPLATES_DIR, "templates_config.json")

DEFAULT_LAYOUT = {
    "name": {"x": 0.5, "y": 0.4, "font_size": 60, "align": "center", "color": "#000000"},
    "event": {"x": 0.5, "y": 0.5, "font_size": 40, "align": "center", "color": "#000000"},
    "date": {"x": 0.15, "y": 0.8, "font_size": 30, "align": "left", "color": "#000000"},
    "code": {"x": 0.85, "y": 0.9, "font_size": 30, "align": "right", "color": "#000000"},
    "qr": {"x": 0.08, "y": 0.7, "size": 0.18}
}


def _default_layout_copy() -> Dict[str, Any]:
    return json.loads(json.dumps(DEFAULT_LAYOUT))


def _ensure_config_file() -> None:
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    if not os.path.exists(CONFIG_PATH):
        default_payload = {
            "templates": [
                {
                    "id": "default",
                    "name": "Default Template",
                    "file": "certificate_template.png",
                    "layout": _default_layout_copy()
                }
            ]
        }
        with open(CONFIG_PATH, "w", encoding="utf-8") as handle:
            json.dump(default_payload, handle, indent=2)


def _load_payload() -> Dict[str, Any]:
    _ensure_config_file()
    with open(CONFIG_PATH, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_payload(payload: Dict[str, Any]) -> None:
    with open(CONFIG_PATH, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def list_templates() -> List[Dict[str, Any]]:
    return _load_payload().get("templates", [])


def get_template(template_id: str) -> Dict[str, Any]:
    for template in list_templates():
        if template.get("id") == template_id:
            return template
    raise ValueError(f"Template '{template_id}' not found")


def add_template(template_id: str, name: str, filename: str, layout: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    payload = _load_payload()
    templates = payload.get("templates", [])
    if any(t.get("id") == template_id for t in templates):
        raise ValueError(f"Template '{template_id}' already exists")
    layout_payload = layout or (templates[0]["layout"] if templates else _default_layout_copy())
    layout_payload = json.loads(json.dumps(layout_payload))
    new_template = {
        "id": template_id,
        "name": name,
        "file": filename,
        "layout": layout_payload,
    }
    templates.append(new_template)
    payload["templates"] = templates
    _write_payload(payload)
    return new_template


def update_template(template_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    payload = _load_payload()
    templates = payload.get("templates", [])
    for idx, template in enumerate(templates):
        if template.get("id") == template_id:
            merged = template.copy()
            if "name" in updates and updates["name"] is not None:
                merged["name"] = updates["name"]
            if "file" in updates and updates["file"] is not None:
                merged["file"] = updates["file"]
            if "layout" in updates and updates["layout"] is not None:
                existing_layout = merged.get("layout", {})
                layout_updates = updates["layout"]
                for key, value in layout_updates.items():
                    if value is None:
                        continue
                    existing_layout[key] = {**existing_layout.get(key, {}), **value}
                merged["layout"] = existing_layout
            templates[idx] = merged
            payload["templates"] = templates
            _write_payload(payload)
            return merged
    raise ValueError(f"Template '{template_id}' not found")


def merge_layout(template: Dict[str, Any], override: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    layout = json.loads(json.dumps(template.get("layout", {})))  # deep copy
    if not override:
        return layout
    for key, value in override.items():
        if value is None:
            continue
        layout[key] = {**layout.get(key, {}), **value}
    return layout


def resolve_template_path(template: Dict[str, Any]) -> str:
    candidate = template.get("file", "certificate_template.png")
    if os.path.isabs(candidate):
        return candidate
    return os.path.join(TEMPLATES_DIR, candidate)
