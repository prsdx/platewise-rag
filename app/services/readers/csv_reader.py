import pandas as pd
from pathlib import Path

def extract_csv_text(file_path):
    """
    Extract data from a CSV file and convert it into semantic, narrative text rows.
    This helps the RAG system's embeddings better understand tabular data.

    Returns:
        list[dict]: A list of pages/rows converted to text narrative
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"CSV not found: {file_path}")

    # Read the CSV using pandas
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file {file_path}: {e}")

    pages = []
    
    # Iterate through rows and create semantic narratives
    for index, row in df.iterrows():
        # Build a descriptive narrative for each row
        narrative = []
        
        # Check if this is the restaurant directory based on columns
        if 'restaurant_name' in df.columns and 'cuisine' in df.columns:
            name = row.get('restaurant_name', 'Unknown Restaurant')
            cuisine = row.get('cuisine', 'Unknown')
            rating = row.get('rating', 'N/A')
            del_time = row.get('delivery_time_mins', 'N/A')
            price = row.get('price_range', 'N/A')
            fssai = row.get('fssai_certified', 'No')
            pure_veg = row.get('is_pure_veg', 'No')
            
            text = (
                f"Restaurant Profile: {name} serves {cuisine} cuisine with a rating of {rating} stars. "
                f"The estimated delivery time is {del_time} minutes and the price range is {price}. "
                f"FSSAI Certified: {fssai}. Pure Veg: {pure_veg}."
            )
            narrative.append(text)
        else:
            # Fallback for generic CSVs: join key-value pairs semantically
            for col in df.columns:
                val = row[col]
                if pd.notna(val):
                    narrative.append(f"The {col.replace('_', ' ')} is {val}.")
            
        page_text = " ".join(narrative)
        
        # Store each row as a "page" conceptually so the chunker handles it properly
        pages.append({
            "page": index + 1,  # 1-indexed row number
            "text": page_text
        })

    return pages
