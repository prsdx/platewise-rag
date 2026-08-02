import os
import shutil
from pathlib import Path

def main():
    root = Path(__file__).parent.resolve()
    scripts_dir = root / "scripts"
    app_dir = root / "app"
    
    if not scripts_dir.exists():
        print("Error: scripts directory not found.")
        return

    print("1. Creating app/ directory (bypassing folder locks)...")
    app_dir.mkdir(exist_ok=True)
    
    print("2. Copying api.py to app/main.py ...")
    api_py = scripts_dir / "api.py"
    main_py = app_dir / "main.py"
    if api_py.exists():
        shutil.copy2(str(api_py), str(main_py))
        
    print("3. Creating app/services/ and copying logic files...")
    services_dir = app_dir / "services"
    services_dir.mkdir(exist_ok=True)
    
    # Create an empty __init__.py in services
    (services_dir / "__init__.py").touch()
    
    files_to_copy = [
        "llm.py",
        "vector_store.py",
        "search.py",
        "chunker.py",
        "document_processor.py",
    ]
    
    for item in files_to_copy:
        src = scripts_dir / item
        dst = services_dir / item
        if src.exists():
            shutil.copy2(str(src), str(dst))
            print(f"  Copied {item} to services/")
            
    print("4. Copying readers folder...")
    src_readers = scripts_dir / "readers"
    dst_readers = services_dir / "readers"
    if src_readers.exists() and not dst_readers.exists():
        shutil.copytree(str(src_readers), str(dst_readers))
        print("  Copied readers/ to services/")
            
    print("\n✅ Structural copy complete! The original 'scripts' folder is untouched for safety.")
    print("Please reply to the AI assistant so it can fix the imports in the new 'app' folder.")

if __name__ == "__main__":
    main()
