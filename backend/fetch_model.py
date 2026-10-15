"""Download the embedding model into the Hugging Face cache, once, when building the image or VM: python -m backend.fetch_model

The API then loads it with no network access (it sets HF_HUB_OFFLINE=1). HF_HOME chooses the cache directory.
"""

from huggingface_hub import snapshot_download

from .index import EMBED_MODEL, EMBED_REVISION

# What SentenceTransformer reads: configs, tokenizer and weights. This model's main revision ships only pytorch_model.bin
# (its model.safetensors sits on an unmerged pull-request branch, which an offline load never reads).
PATTERNS = ["*.json", "*.txt", "pytorch_model.bin", "model.safetensors", "1_Pooling/*"]


def fetch(model: str = EMBED_MODEL, revision: str = EMBED_REVISION) -> str:
    return snapshot_download(model, revision=revision, allow_patterns=PATTERNS)


if __name__ == "__main__":
    print(fetch())
