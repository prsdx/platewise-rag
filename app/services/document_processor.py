from pathlib import Path

from app.services.readers.pdf_reader import extract_pdf_text
from app.services.readers.docx_reader import extract_docx_text
from app.services.readers.txt_reader import extract_txt_text
from app.services.readers.pptx_reader import extract_pptx_text
from app.services.readers.md_reader import extract_md_text
from app.services.readers.csv_reader import extract_csv_text


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".pptx",
    ".md",
    ".csv",
}


def extract_document(file_path):
    """
    Extract text from a supported document.
    """

    file_path = Path(file_path)

    extension = file_path.suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {extension}")

    file_path_str = str(file_path)

    if extension == ".pdf":
        return extract_pdf_text(file_path_str)

    if extension == ".docx":
        return extract_docx_text(file_path_str)

    if extension == ".txt":
        return extract_txt_text(file_path_str)

    if extension == ".pptx":
        return extract_pptx_text(file_path_str)

    if extension == ".md":
        return extract_md_text(file_path_str)

    if extension == ".csv":
        return extract_csv_text(file_path_str)

    raise ValueError(f"No reader available for {extension}")