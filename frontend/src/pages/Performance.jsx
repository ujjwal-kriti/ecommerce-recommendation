import React from "react";

export default function Performance() {
  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4 text-purple-700">Performance</h1>
      <p className="text-gray-600 mb-6">
        Monitor your business KPIs and performance metrics.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-50 p-6 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Revenue</h2>
          <p className="text-gray-500">₹1,20,000</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Orders</h2>
          <p className="text-gray-500">320</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Growth</h2>
          <p className="text-gray-500">+12% this month</p>
        </div>
      </div>
    </div>
  );
}