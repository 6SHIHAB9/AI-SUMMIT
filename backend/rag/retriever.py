import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings
from dotenv import load_dotenv

load_dotenv()

vector_store_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vector_store"))

_vector_store = None

def get_retriever():
    global _vector_store
    if _vector_store is None:
        ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        embed_model = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
        
        if not os.path.exists(vector_store_path):
            return None
        
        embeddings = OllamaEmbeddings(
            base_url=ollama_base_url,
            model=embed_model
        )
        try:
            _vector_store = FAISS.load_local(vector_store_path, embeddings, allow_dangerous_deserialization=True)
        except Exception as e:
            print("Failed to load FAISS index:", e)
            return None
            
    return _vector_store

def search_kb(query: str, top_k: int = 4, relevance_threshold: float = 1.0):
    vs = get_retriever()
    if not vs:
        return []
        
    try:
        # returns List[Tuple[Document, float]]
        results = vs.similarity_search_with_score(query, k=top_k)
        
        valid_results = []
        for doc, score in results:
            # lower score is better (L2 distance in FAISS)
            if score <= relevance_threshold:
                valid_results.append({
                    "text": doc.page_content,
                    "source": doc.metadata.get("source"),
                    "department": doc.metadata.get("department"),
                    "score": float(score)
                })
        return valid_results
    except Exception as e:
        print("Retrieval failed:", e)
        return []
