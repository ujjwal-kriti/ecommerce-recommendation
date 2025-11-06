Python ML microservice (FastAPI)

This service provides a simple product recommender implemented in Python using scikit-learn.
It trains a TF-IDF representation over product text (name + brand + category + description + tags)
and uses NearestNeighbors (cosine) to return products similar to items in the cart.

Requirements
- Python 3.9+
- Install dependencies:
  pip install -r requirements.txt

Configuration
- The service reads MongoDB URI from the environment variable `MONGODB_URI`.
- Optionally set `PORT` (default 8000).

Run (development)
From `backend/python_ml`:

# install dependencies
python -m pip install -r requirements.txt

# run service
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

Endpoints
- GET /health -> returns {"status": "ok"}
- POST /recommendations/cart -> body: { "productIds": ["id1", "id2"], "limit": 8 }
  returns: { "success": true, "data": { "recommendations": [ ... ] } }

Notes
- On startup the service loads products from MongoDB and builds the TF-IDF index. For large catalogs you may want
  to pre-compute and persist the vectorizer + model using joblib.
- This is a minimal, self-contained example. For production, consider batching training, caching, and auth.
