import sys
import pandas as pd
from pathlib import Path

# Add scripts directory to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT / "scripts"))

from readers.csv_reader import extract_csv_text

def test_csv_reader_semantic_narrative(tmp_path):
    """
    Test that the CSV reader correctly converts tabular rows into semantic text narratives.
    """
    # Create a temporary CSV file for testing
    csv_file = tmp_path / "test_directory.csv"
    
    # Create test data matching the expected schema
    test_data = pd.DataFrame({
        "restaurant_id": [101, 102],
        "restaurant_name": ["Spice Garden", "Burger Bros"],
        "cuisine": ["Indian", "American"],
        "rating": [4.5, 4.0],
        "delivery_time_mins": [35, 20],
        "price_range": ["₹₹", "₹₹"],
        "fssai_certified": ["Yes", "Yes"],
        "is_pure_veg": ["No", "No"]
    })
    
    test_data.to_csv(csv_file, index=False)
    
    # Extract
    pages = extract_csv_text(csv_file)
    
    # Verify we got 2 rows/pages
    assert len(pages) == 2
    
    # Verify semantic narrative content for row 1
    row_1_text = pages[0]["text"]
    assert "Restaurant Profile: Spice Garden" in row_1_text
    assert "serves Indian cuisine" in row_1_text
    assert "rating of 4.5 stars" in row_1_text
    assert "delivery time is 35 minutes" in row_1_text
    assert "FSSAI Certified: Yes" in row_1_text
    
    # Verify semantic narrative content for row 2
    row_2_text = pages[1]["text"]
    assert "Burger Bros" in row_2_text
    assert "American cuisine" in row_2_text

def test_csv_reader_generic_fallback(tmp_path):
    """
    Test that the CSV reader handles generic CSVs by joining key/value pairs.
    """
    csv_file = tmp_path / "generic.csv"
    
    test_data = pd.DataFrame({
        "user_id": [1],
        "favorite_food": ["Pizza"]
    })
    
    test_data.to_csv(csv_file, index=False)
    
    pages = extract_csv_text(csv_file)
    
    assert len(pages) == 1
    text = pages[0]["text"]
    
    # Underscores should be replaced with spaces
    assert "The user id is 1." in text
    assert "The favorite food is Pizza." in text
