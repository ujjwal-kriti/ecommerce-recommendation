import React from "react";

export default function Reports() {
  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4 text-green-700">Reports</h1>
      <p className="text-gray-600 mb-6">
        Generate and view detailed business reports.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Sales Report</h2>
          <p className="text-gray-500">Analyze your sales performance.</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2">Order Report</h2>
          <p className="text-gray-500">Track order trends and fulfillment.</p>
        </div>
      </div>
    </div>
  );
}