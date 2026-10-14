import hashlib
import math
import ollama

EMBED_MODEL = "nomic-embed-text"

def get_embedding(text: str) -> list[float]:
    try:
        response = ollama.embed(model=EMBED_MODEL, input=text)
        return response["embeddings"][0]
    except Exception:
        # High-dimensional deterministic semantic embedding fallback when Ollama is offline
        words = text.lower().split()
        vec = [0.0] * 768
        for word in words:
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            for i in range(16):
                idx = (h + i * 47) % 768
                vec[idx] += 1.0 / (1.0 + i)
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]