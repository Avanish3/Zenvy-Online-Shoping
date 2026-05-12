from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="ZENVY AI Runtime", version="1.0.0")


class RecommendRequest(BaseModel):
    products: list[dict] = Field(default_factory=list)
    userId: str | None = None
    focusCategory: str | None = None
    limit: int = 10


class VisionSearchRequest(BaseModel):
    products: list[dict] = Field(default_factory=list)
    query: str | None = None
    imageLabel: str | None = None
    colorHint: str | None = None


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "zenvy-ai-runtime"}


@app.post("/recommend")
def recommend(payload: RecommendRequest) -> dict:
    items = payload.products
    if payload.focusCategory:
        items = [item for item in items if item.get("category") == payload.focusCategory]

    ranked = sorted(
        items,
        key=lambda item: (
            len(item.get("tags", [])) * 5 + int(item.get("availableQuantity", 0))
        ),
        reverse=True,
    )[: payload.limit]
    return {"items": ranked}


@app.post("/vision/search")
def vision_search(payload: VisionSearchRequest) -> dict:
    hints = " ".join(filter(None, [payload.query, payload.imageLabel, payload.colorHint])).lower()
    results = []
    for item in payload.products:
        text = " ".join(
            [
                str(item.get("name", "")),
                str(item.get("category", "")),
                " ".join(item.get("tags", [])),
            ]
        ).lower()
        if not hints or any(token in text for token in hints.split()):
            results.append(item)

    return {"results": results[:10]}


@app.post("/embed/image")
def embed_image(payload: dict) -> dict:
    image_label = str(payload.get("imageLabel", "image"))
    embedding = [float((ord(ch) % 13)) / 13.0 for ch in image_label[:16]]
    return {"embedding": embedding}
