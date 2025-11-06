import os
import logging
from typing import List, Tuple
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from pymongo import MongoClient

logger = logging.getLogger(__name__)

class ProductRecommender:
    def __init__(self, mongo_uri: str, db_name: str = 'qwipo-recommendations'):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.client = None
        self.db = None
        self.products = []  # list of product dicts
        self.ids = []
        self.vectorizer = None
        self.model = None

    def connect_db(self):
        self.client = MongoClient(self.mongo_uri)
        self.db = self.client.get_database()

    def load_products(self):
        if self.db is None:
            self.connect_db()
        col = self.db.get_collection('products')
        # Only load active products
        docs = list(col.find({ 'isActive': True }))
        self.products = docs
        self.ids = [str(d['_id']) for d in docs]
        logger.info(f"Loaded {len(self.products)} products from MongoDB")

    def build_corpus(self) -> List[str]:
        corpus = []
        for p in self.products:
            parts = [p.get('name',''), p.get('brand',''), p.get('category',''), p.get('description','')]
            if p.get('tags'):
                parts.append(' '.join(p.get('tags')))
            text = ' '.join([str(x) for x in parts if x])
            corpus.append(text.lower())
        return corpus

    def train(self):
        """Train vectorizer + KNN model on current product catalog"""
        if not self.products:
            self.load_products()

        corpus = self.build_corpus()
        self.vectorizer = TfidfVectorizer(max_features=20000, ngram_range=(1,2))
        X = self.vectorizer.fit_transform(corpus)

        # Use cosine metric via metric='cosine' in NearestNeighbors
        self.model = NearestNeighbors(n_neighbors=50, metric='cosine', algorithm='brute')
        self.model.fit(X)

        logger.info('Trained TF-IDF + KNN model')

    def recommend_for_product_ids(self, product_ids: List[str], k: int = 8) -> List[dict]:
        if self.model is None or self.vectorizer is None:
            self.train()

        # Map product ids to indices
        id_to_index = {pid: idx for idx, pid in enumerate(self.ids)}
        valid_indices = [id_to_index[pid] for pid in product_ids if pid in id_to_index]

        if not valid_indices:
            logger.info('No cart products found in index, returning empty list')
            return []

        # Build a combined vector by averaging vectors of cart items
        corpus = self.build_corpus()
        X = self.vectorizer.transform(corpus)

        # Average vector
        vectors = X[valid_indices]
        mean_vector = vectors.mean(axis=0)

        # Query model for nearest neighbors to the mean vector
        distances, indices = self.model.kneighbors(mean_vector, n_neighbors=min(50, X.shape[0]))

        # distances/indices are arrays with shape (1, n_neighbors)
        indices = indices.tolist()[0]
        distances = distances.tolist()[0]

        results = []
        seen = set(product_ids)
        for idx, dist in zip(indices, distances):
            pid = self.ids[idx]
            if pid in seen:
                continue
            prod = self.products[idx]
            score = float(1.0 - dist)  # convert cosine distance to similarity-like score
            results.append({
                'productId': pid,
                'score': round(score, 4),
                'reason': 'Python TF-IDF KNN similar to cart items',
                'product': {
                    '_id': prod.get('_id'),
                    'name': prod.get('name'),
                    'brand': prod.get('brand'),
                    'category': prod.get('category'),
                    'businessType': prod.get('businessType'),
                    'price': prod.get('price'),
                    'images': prod.get('images'),
                    'ratings': prod.get('ratings'),
                    'inventory': prod.get('inventory'),
                    'description': prod.get('description')
                }
            })
            if len(results) >= k:
                break

        return results

    def close(self):
        if self.client:
            self.client.close()
