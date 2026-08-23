import os
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

def ingest_kb():
    # Read env vars
    ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    embed_model = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    
    # Paths
    # Current script is in backend/
    base_dir = os.path.dirname(os.path.abspath(__file__))
    kb_path = os.path.abspath(os.path.join(base_dir, "..", "knowledge_base"))
    vector_store_path = os.path.join(base_dir, "vector_store")
    
    if not os.path.exists(kb_path):
        print(f"Error: Knowledge base directory not found at {kb_path}")
        return

    # Find all md files
    documents = []
    
    print(f"Loading documents from {kb_path}...")
    for root, dirs, files in os.walk(kb_path):
        for file in files:
            if file.endswith(".md"):
                file_path = os.path.join(root, file)
                # folder name is department
                department = os.path.basename(root)
                if department == "knowledge_base":
                    department = "general"
                    
                # Load content
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                from langchain_core.documents import Document
                doc = Document(
                    page_content=content,
                    metadata={"source": file, "department": department}
                )
                documents.append(doc)

    print(f"Loaded {len(documents)} documents.")
    if not documents:
        print("No documents found. Exiting.")
        return
        
    # Split
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks.")
    
    # Embed
    print(f"Generating embeddings using {embed_model} (url: {ollama_base_url})...")
    embeddings = OllamaEmbeddings(
        base_url=ollama_base_url,
        model=embed_model
    )
    
    print("Building FAISS index...")
    vector_store = FAISS.from_documents(chunks, embeddings)
    
    os.makedirs(vector_store_path, exist_ok=True)
    vector_store.save_local(vector_store_path)
    print(f"FAISS index created successfully at: {vector_store_path}")

if __name__ == "__main__":
    ingest_kb()
