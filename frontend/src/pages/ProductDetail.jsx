import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
  HeartIcon,
  ShareIcon,
  StarIcon,
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchSimilarProducts();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProduct(id);
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      const response = await apiService.getSimilarProducts(id, 4);
      if (response.success) {
        setSimilarProducts(response.data.similarProducts);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleAddToCart = () => {
    // Add to cart functionality would be implemented here
    console.log('Adding to cart:', product._id, quantity);
    // For demo, show success message
    alert(`Added ${quantity} x ${product.name} to cart!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <button onClick={() => navigate('/products')} className="hover:text-gray-700">
          Products
        </button>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-xl bg-gray-200">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-96 object-cover object-center"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📦</div>
                  <div>No Image Available</div>
                </div>
              </div>
            )}
          </div>

          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((image, index) => (
                <div key={index} className="aspect-w-1 aspect-h-1 rounded-lg bg-gray-200 overflow-hidden">
                  <img src={image} alt={`${product.name} ${index + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-lg text-gray-600 mt-2">{product.brand} • {product.category}</p>

            {product.ratings.count > 0 && (
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.ratings.average)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {product.ratings.average} ({product.ratings.count} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-qwipo-primary">
              {formatCurrency(product.price.discountedPrice)}
            </span>
            {product.price.discount > 0 && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  {formatCurrency(product.price.mrp)}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                  {product.price.discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {product.inventory.stock > 0 ? (
              <>
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span className="text-green-600 font-medium">
                  In Stock ({product.inventory.stock} available)
                </span>
              </>
            ) : (
              <>
                <XMarkIcon className="h-5 w-5 text-red-500" />
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="font-medium text-gray-900">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-1 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.inventory.stock, quantity + 1))}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  disabled={quantity >= product.inventory.stock}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAddToCart}
                disabled={product.inventory.stock === 0}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                <span>Add to Cart</span>
              </button>

              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <HeartIcon className="h-5 w-5 text-gray-600" />
              </button>

              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <ShareIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <TruckIcon className="h-5 w-5" />
              <span>Free shipping on orders above ₹1000</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ShieldCheckIcon className="h-5 w-5" />
              <span>100% authentic products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((similarProduct) => (
              <div
                key={similarProduct._id}
                className="card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/products/${similarProduct._id}`)}
              >
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4">
                  {similarProduct.images?.[0] ? (
                    <img
                      src={similarProduct.images[0]}
                      alt={similarProduct.name}
                      className="h-48 w-full object-cover object-center"
                    />
                  ) : (
                    <div className="h-48 w-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 truncate">{similarProduct.name}</h3>
                  <p className="text-sm text-gray-500">{similarProduct.brand}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-qwipo-primary">
                      {formatCurrency(similarProduct.price.discountedPrice)}
                    </span>
                    {similarProduct.price.discount > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {similarProduct.price.discount}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
