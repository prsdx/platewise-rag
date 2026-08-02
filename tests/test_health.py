import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add scripts directory to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT / "app"))
sys.path.append(str(PROJECT_ROOT))

from app.main import app

client = TestClient(app)


def test_api_health():
    """
    Test that the root endpoint returns PlateWise status and message.
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert "PlateWise" in data["message"]
