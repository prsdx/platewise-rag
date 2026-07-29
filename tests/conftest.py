import chromadb
import scripts.vector_store

class MockSentenceTransformerEmbeddingFunction(chromadb.EmbeddingFunction):
    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        return [[0.0] * 384 for _ in input]

if not scripts.vector_store._EF_ST:
    scripts.vector_store._EF_ST = MockSentenceTransformerEmbeddingFunction()
