"use client";
import { useState } from 'react';

const ApiTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoints = async () => {
    setIsLoading(true);
    setTestResults([]);
    const results = [];
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://legal-document-processor-1.onrender.com';
    
    // Test endpoints
    const endpoints = [
      { name: 'Root', url: `${API_URL}/`, method: 'GET' },
      { name: 'Health', url: `${API_URL}/health/`, method: 'GET' },
      { name: 'Upload OPTIONS', url: `${API_URL}/upload/upload`, method: 'OPTIONS' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
        
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          mode: 'cors',
        });
        
        let data = null;
        try {
          data = await response.json();
        } catch (e) {
          data = await response.text();
        }
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          success: response.ok,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          success: false,
          error: error.message
        });
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">API Connection Test</h2>
      
      <button 
        onClick={testEndpoints}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test API Connection'}
      </button>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className={`p-4 rounded ${result.success ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-white">{result.name}</h3>
              <span className={`px-2 py-1 rounded text-sm ${result.success ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                {result.status}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{result.url}</p>
            {result.error && (
              <p className="text-red-400 text-sm">Error: {result.error}</p>
            )}
            {result.data && (
              <pre className="text-xs text-gray-400 bg-slate-900 p-2 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiTest;