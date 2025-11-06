import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

from model import ProductRecommender

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/qwipo-recommendations')
PORT = int(os.getenv('PORT', '8000'))

app = FastAPI(title='Qwipo Python Recommender')

recommender = None

class CartRequest(BaseModel):
    productIds: List[str]
    limit: Optional[int] = 8

@app.on_event('startup')
async def startup_event():
    global recommender
    try:
        recommender = ProductRecommender(MONGODB_URI)
        recommender.load_products()
        recommender.train()
        logger.info('Python recommender ready')
    except Exception as e:
        logger.exception('Failed to initialize recommender: %s', e)

@app.get('/health')
async def health():
    return { 'status': 'ok' }

@app.post('/recommendations/cart')
async def cart_recommendations(req: CartRequest):
    if recommender is None:
        raise HTTPException(status_code=503, detail='Recommender not ready')
    recs = recommender.recommend_for_product_ids(req.productIds, k=req.limit)
    return { 'success': True, 'data': { 'recommendations': recs, 'total': len(recs) } }

@app.on_event('shutdown')
async def shutdown_event():
    if recommender:
        recommender.close()
