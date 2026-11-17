"""Writes the OpenAPI document for packages/contracts.

Usage: python -m ai_service.export_openapi <output.json>
"""

import json
import sys
from pathlib import Path

from pydantic import SecretStr

from ai_service.app import create_app
from ai_service.config import Settings

if __name__ == "__main__":
    # The schema does not depend on secrets; a placeholder satisfies settings validation.
    app = create_app(Settings(service_token=SecretStr("openapi-export-" + "x" * 32)))
    # LF on every OS, so CI can detect stale contracts with a plain git diff.
    Path(sys.argv[1]).write_text(
        json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8", newline="\n"
    )
