# ZENVY Service Split

These directories provide separate service entrypoints that can be deployed independently:

- `gateway`
- `auth`
- `orders`
- `payments`
- `logistics`
- `ai`
- `ai-ml` (Python FastAPI runtime)

Each Node service reuses the shared repository and route modules from `src/`, while `ai-ml` is a standalone Python runtime intended for recommendation and vision endpoints.
