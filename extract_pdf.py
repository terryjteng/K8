from pypdf import PdfReader
import sys
import os

def extract_pdf_text(pdf_path):
    try:
        pdf_reader = PdfReader(pdf_path)
        text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            text += f"\n--- Page {page_num + 1} ---\n"
            text += page.extract_text()
        return text
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    
    docs_folder = r"c:\Users\terry\Downloads\K8-main\K8-main\Documents\LL\Demo"
    
    # Extract the three key documents
    files = [
        "LAST LIGHT DEMO — GAME OVERVIEW.pdf",
        "LAST LIGHT DEMO - High-Level Timeline.pdf",
        "LAST LIGHT — DEMO GAME DESIGN DOCUMENT (GDD).pdf"
    ]
    
    for filename in files:
        filepath = os.path.join(docs_folder, filename)
        print(f"\n{'='*80}")
        print(f"EXTRACTING: {filename}")
        print(f"{'='*80}")
        if os.path.exists(filepath):
            text = extract_pdf_text(filepath)
            print(text)
        else:
            print(f"File not found: {filepath}")
