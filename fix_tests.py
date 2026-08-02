import os
from pathlib import Path

def main():
    root = Path(__file__).parent.resolve()
    tests_dir = root / "tests"
    
    if not tests_dir.exists():
        print("Tests directory not found.")
        return

    for filepath in tests_dir.rglob("*.py"):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        modified = content.replace('PROJECT_ROOT / "scripts"', 'PROJECT_ROOT / "app"')
        modified = modified.replace('SCRIPTS_PATH = PROJECT_ROOT / "scripts"', 'SCRIPTS_PATH = PROJECT_ROOT / "app"')
        modified = modified.replace('from scripts.chunker', 'from app.services.chunker')
        modified = modified.replace('from scripts.vector_store', 'from app.services.vector_store')
        modified = modified.replace('from scripts.search', 'from app.services.search')
        modified = modified.replace('from scripts.llm', 'from app.services.llm')
        modified = modified.replace('from scripts.api', 'from app.main')
        modified = modified.replace('from scripts.readers', 'from app.services.readers')
        modified = modified.replace('from scripts.document_processor', 'from app.services.document_processor')
        
        if content != modified:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(modified)
            print(f"Updated {filepath.name}")

    print("\n✅ Tests imports updated successfully!")

if __name__ == "__main__":
    main()
