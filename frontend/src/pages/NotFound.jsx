import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-qwipo-primary to-qwipo-secondary flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <ExclamationTriangleIcon className="h-24 w-24 text-white/80 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
          <p className="text-lg text-white/80">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 bg-white text-qwipo-primary font-medium py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            <span>Go to Dashboard</span>
          </Link>

          <div className="text-white/60">
            <p>Or try one of these:</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link to="/products" className="text-white hover:underline">Products</Link>
              <Link to="/recommendations" className="text-white hover:underline">Recommendations</Link>
              <Link to="/ai-assistant" className="text-white hover:underline">AI Assistant</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
