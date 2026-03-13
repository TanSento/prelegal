"""Document configurations for all supported document types."""
import json
from pathlib import Path

_catalog_path = Path(__file__).parent / "catalog.json"
if not _catalog_path.exists():
    _catalog_path = Path(__file__).parent.parent / "catalog.json"
with open(_catalog_path) as f:
    _catalog_raw = json.load(f)

# Map doc type keys to catalog entries (NDA cover page is part of NDA flow, not standalone)
DOC_TYPE_MAP = {
    "nda": "Mutual Non-Disclosure Agreement",
    "csa": "Cloud Service Agreement",
    "sla": "Service Level Agreement",
    "design-partner": "Design Partner Agreement",
    "psa": "Professional Services Agreement",
    "dpa": "Data Processing Agreement",
    "partnership": "Partnership Agreement",
    "software-license": "Software License Agreement",
    "pilot": "Pilot Agreement",
    "baa": "Business Associate Agreement",
    "ai-addendum": "AI Addendum",
}

CATALOG: dict[str, dict] = {}
for _entry in _catalog_raw:
    for _key, _name in DOC_TYPE_MAP.items():
        if _entry["name"] == _name:
            CATALOG[_key] = _entry

DOCUMENT_CATALOG_TEXT = "\n".join(
    f'- {k}: {CATALOG[k]["name"]} — {CATALOG[k]["description"][:90]}...'
    for k in CATALOG
)
