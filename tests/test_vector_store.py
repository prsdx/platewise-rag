import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add scripts directory to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT / "app"))

from vector_store import get_collection

@patch("vector_store.vecs.create_client")
@patch("vector_store.DB_CONNECTION", "postgres://mock")
def test_vector_store_collection(mock_create_client):
    """
    Test that we can retrieve our Supabase vecs collection.
    """
    mock_client = MagicMock()
    mock_collection = MagicMock()
    mock_collection.name = "platewise_docs"
    mock_client.get_or_create_collection.return_value = mock_collection
    mock_create_client.return_value = mock_client
    
    collection = get_collection()
    assert collection is not None
    assert collection.name == "platewise_docs"
    mock_client.get_or_create_collection.assert_called_once_with(name="platewise_docs", dimension=384)
