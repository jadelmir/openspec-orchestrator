import json
import sys
from llmlingua import PromptCompressor

def main():
    payload = json.load(sys.stdin)
    text = payload["text"]
    target_token = payload.get("target_token", 2000)

    compressor = PromptCompressor()
    result = compressor.compress_prompt(text, target_token=target_token)

    print(json.dumps({
        "compressed_prompt": result["compressed_prompt"],
        "origin_tokens": result.get("origin_tokens"),
        "compressed_tokens": result.get("compressed_tokens"),
        "ratio": result.get("ratio"),
    }))

if __name__ == "__main__":
    main()
