import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ShoppingCartIcon,
  BoltIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    businessType: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    discountOnly: false,
    inStock: false,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [activeBusinessType, setActiveBusinessType] = useState('all');
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart, getItemQuantity } = useCart();

  // Debounced fetch function
  const debouncedFetchProducts = React.useCallback(
    React.useMemo(() => {
      let timeoutId;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (!isFetching) {
            fetchProducts();
          }
        }, 300); // 300ms debounce
      };
    }, [isFetching]),
    [isFetching]
  );

  // Fetch categories only once on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products with debouncing
  useEffect(() => {
    const now = Date.now();
    const CACHE_TIMEOUT = 2 * 60 * 1000; // 2 minutes cache
    
    if (now - lastFetchTime > CACHE_TIMEOUT || !products.length) {
      debouncedFetchProducts();
    }
  }, [currentPage, filters, debouncedFetchProducts, lastFetchTime, products.length]);

  // Set user's business type as default filter
  useEffect(() => {
    if (user?.businessType && businessTypeConfigs[user.businessType]) {
      setActiveBusinessType(user.businessType);
      setFilters(prev => ({ ...prev, businessType: user.businessType }));
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success) {
        setCategories(response.data.categories);
        setBrands(response.data.brands);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    if (isFetching) return; // Prevent multiple simultaneous calls
    
    try {
      setIsFetching(true);
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        ...filters,
        search: searchQuery,
      };

      const response = await apiService.getProducts(params);
      if (response.success) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
        setLastFetchTime(Date.now());
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Set fallback data to prevent empty state
      if (!products.length) {
        setProducts([]);
        setPagination({});
      }
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setLastFetchTime(0); // Force refresh
    debouncedFetchProducts();
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
    setLastFetchTime(0); // Force refresh
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      businessType: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      discountOnly: false,
      inStock: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    setSearchQuery('');
    setCurrentPage(1);
    setActiveBusinessType('all');
  };

  // Business type configurations with relevant categories
  const businessTypeConfigs = {
    all: {
      name: 'All Products',
      icon: '🛍️',
      description: 'Browse all available products',
      categories: []
    },
    grocery: {
      name: 'Grocery Store',
      icon: '🛒',
      description: 'Food, beverages & daily essentials',
      categories: ['Groceries', 'Food & Beverages', 'Health', 'Kitchen']
    },
    pharmacy: {
      name: 'Pharmacy',
      icon: '💊',
      description: 'Healthcare & medical supplies',
      categories: ['Health', 'Beauty', 'Medical Supplies', 'Personal Care']
    },
    retail: {
      name: 'Retail Store',
      icon: '🏪',
      description: 'General merchandise & supplies',
      categories: ['Electronics', 'Clothing', 'Home & Garden', 'Toys', 'Books']
    },
    wholesale: {
      name: 'Wholesale Business',
      icon: '📦',
      description: 'Bulk products & supplies',
      categories: ['Office Supplies', 'Tools', 'Automotive', 'Electronics']
    },
    other: {
      name: 'Other Business',
      icon: '🏢',
      description: 'Various business needs',
      categories: []
    }
  };

  const handleBusinessTypeChange = (businessType) => {
    setActiveBusinessType(businessType);
    setFilters({
      ...filters,
      businessType: businessType === 'all' ? '' : businessType
    });
    setCurrentPage(1);
    setLastFetchTime(0); // Force refresh
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const ProductCard = ({ product }) => {
    const [quantity, setQuantity] = useState(1);
    const currentQuantity = getItemQuantity(product._id);
    const inCart = isInCart(product._id);

    const handleAddToCart = async (e) => {
      e.stopPropagation(); // Prevent navigation to product detail
      try {
        await addToCart(product, quantity);
        setQuantity(1); // Reset quantity after adding
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    };

    const handleBuyNow = async (e) => {
      e.stopPropagation(); // Prevent navigation to product detail
      try {
        await addToCart(product, quantity);
        navigate('/cart'); // Navigate to cart/checkout
      } catch (error) {
        console.error('Error in buy now:', error);
      }
    };

    const handleQuantityChange = (newQuantity) => {
      if (newQuantity >= 1 && newQuantity <= product.inventory.stock) {
        setQuantity(newQuantity);
      }
    };

    return (
      <div className="card hover:shadow-lg transition-all group">
        {/* Product Image */}
        <div 
          className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4 cursor-pointer"
          onClick={() => navigate(`/products/${product._id}`)}
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-48 w-full object-cover object-center group-hover:scale-105 transition-transform"
              onError={(e) => {
                // Fallback to second image or placeholder
                if (product.images?.[1] && e.target.src !== product.images[1]) {
                  e.target.src = product.images[1];
                } else if (e.target.src !== 'https://via.placeholder.com/400x400?text=Product+Image') {
                  e.target.src = 'https://via.placeholder.com/400x400?text=Product+Image';
                }
              }}
            />
          ) : (
            <div className="h-48 w-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-3">
          <div 
            className="cursor-pointer"
            onClick={() => navigate(`/products/${product._id}`)}
          >
            <h3 className="font-medium text-gray-900 group-hover:text-qwipo-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500">{product.brand} • {product.category}</p>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-qwipo-primary">
                {formatCurrency(product.price.discountedPrice)}
              </span>
              {product.price.mrp > product.price.discountedPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(product.price.mrp)}
                </span>
              )}
            </div>

            {product.price.mrp > product.price.discountedPrice && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {Math.round(((product.price.mrp - product.price.discountedPrice) / product.price.mrp) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Stock and Rating */}
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${
              product.inventory.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {product.inventory.stock > 0 
                ? `${product.inventory.stock} in stock` 
                : 'Out of stock'
              }
            </span>

            {product.ratings.count > 0 && (
              <div className="flex items-center">
                <span className="text-yellow-400">★</span>
                <span className="ml-1 text-gray-600">
                  {product.ratings.average} ({product.ratings.count})
                </span>
              </div>
            )}
          </div>

          {/* Cart Info */}
          {inCart && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-700 font-medium">
                ✓ {currentQuantity} in cart
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          {product.inventory.stock > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(quantity - 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={quantity <= 1}
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-12 text-center border border-gray-300 rounded-md py-1 text-sm"
                  min="1"
                  max={product.inventory.stock}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange(quantity + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={quantity >= product.inventory.stock}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {product.inventory.stock > 0 ? (
            <div className="space-y-2">
              <button
                onClick={handleAddToCart}
                className="w-full btn-outline flex items-center justify-center space-x-2 py-2 text-sm"
              >
                <ShoppingCartIcon className="h-4 w-4" />
                <span>{inCart ? 'Add More' : 'Add to Cart'}</span>
              </button>
              
              <button
                onClick={handleBuyNow}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-2 text-sm"
              >
                <BoltIcon className="h-4 w-4" />
                <span>Buy Now</span>
              </button>
            </div>
          ) : (
            <button
              className="w-full btn-disabled flex items-center justify-center space-x-2 py-2 text-sm"
              disabled
            >
              <span>Out of Stock</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Discover products for your business</p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-outline flex items-center space-x-2 sm:hidden"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, brand, or category..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Business Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BuildingStorefrontIcon className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Shop by Business Type</h3>
          </div>
          {user?.businessType && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Your type: {businessTypeConfigs[user.businessType]?.name || user.businessType}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {Object.entries(businessTypeConfigs).map(([key, config]) => (
            <button
              key={key}
              onClick={() => handleBusinessTypeChange(key)}
              className={`p-3 rounded-lg text-center transition-all hover:shadow-md ${
                activeBusinessType === key
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              } ${key === user?.businessType ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className="text-lg mb-1">{config.icon}</div>
              <div className="font-medium text-xs">{config.name}</div>
              {key === user?.businessType && (
                <div className="text-xs mt-1 opacity-75">Recommended</div>
              )}
            </button>
          ))}
        </div>
        
        {activeBusinessType !== 'all' && businessTypeConfigs[activeBusinessType].categories.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <span className="font-medium">{businessTypeConfigs[activeBusinessType].name}:</span> {businessTypeConfigs[activeBusinessType].description}
            </p>
            <div className="flex flex-wrap gap-2">
              {businessTypeConfigs[activeBusinessType].categories.map((category) => (
                <span
                  key={category}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={`card ${showFilters || 'hidden'} sm:block`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-qwipo-primary hover:text-qwipo-secondary text-sm font-medium"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="input-field"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="input-field"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="input-field"
          />

          <select
            value={filters.minRating}
            onChange={(e) => handleFilterChange('minRating', e.target.value)}
            className="input-field"
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>

          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="input-field"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price.discountedPrice-asc">Price (Low to High)</option>
            <option value="price.discountedPrice-desc">Price (High to Low)</option>
            <option value="ratings.average-desc">Highest Rated</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="analytics.purchases-desc">Most Popular</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              className="rounded border-gray-300 text-qwipo-primary focus:ring-qwipo-primary"
            />
            <span className="text-sm text-gray-700">In Stock Only</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.discountOnly}
              onChange={(e) => handleFilterChange('discountOnly', e.target.checked)}
              className="rounded border-gray-300 text-qwipo-primary focus:ring-qwipo-primary"
            />
            <span className="text-sm text-gray-700">On Sale Only</span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-48 rounded-lg mb-4" />
              <div className="skeleton-text mb-2" />
              <div className="skeleton-text w-3/4 mb-4" />
              <div className="flex justify-between">
                <div className="skeleton-text w-1/3" />
                <div className="skeleton-text w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          {/* Business-Specific Products Header */}
          {activeBusinessType !== 'all' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{businessTypeConfigs[activeBusinessType].icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Products for {businessTypeConfigs[activeBusinessType].name}
                  </h2>
                  <p className="text-gray-600 mb-3">
                    {businessTypeConfigs[activeBusinessType].description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {businessTypeConfigs[activeBusinessType].categories.map((category) => (
                      <span
                        key={category}
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                  <div className="text-sm text-gray-600">Products Available</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Showing {products.length} of {pagination.total} products
              {activeBusinessType !== 'all' && (
                <span className="ml-2 text-blue-600 font-medium">
                  for {businessTypeConfigs[activeBusinessType].name}
                </span>
              )}
            </p>
            <div className="text-sm text-gray-500">
              {user?.businessType === activeBusinessType && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  ✓ Recommended for your business
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center space-x-2">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => {
                    console.log(`Clicking page ${i + 1}, current page: ${currentPage}`);
                    setCurrentPage(i + 1);
                  }}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === i + 1
                      ? 'bg-qwipo-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search or filters to find what you're looking for
          </p>
          <button onClick={clearFilters} className="btn-primary">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
