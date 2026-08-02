import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT / "app"))
sys.path.append(str(PROJECT_ROOT))

from app.main import app

client = TestClient(app)

def test_auth_rejection():
    """
    Test that an unauthenticated user gets rejected (HTTP 403 or 401).
    Since we use HTTPBearer, missing token returns 403.
    """
    # Upload requires auth
    response = client.get("/documents")
    assert response.status_code in (401, 403)

    # Query requires auth
    response = client.post("/query", json={"question": "hello"})
    assert response.status_code in (401, 403)
