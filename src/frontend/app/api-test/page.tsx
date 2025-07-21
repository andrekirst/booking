"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/client";

interface TestResult {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
  details?: unknown;
}

export default function ApiTestPage() {
  const [results, setResults] = useState<{ [key: string]: TestResult }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const testEndpoint = async (name: string, testFn: () => Promise<unknown>) => {
    setLoading((prev) => ({ ...prev, [name]: true }));
    try {
      const result = await testFn();
      setResults((prev) => ({ ...prev, [name]: { success: true, data: result } }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number' 
        ? error.statusCode 
        : undefined;
      const details = error && typeof error === 'object' && 'details' in error 
        ? error.details 
        : undefined;

      setResults((prev) => ({
        ...prev,
        [name]: {
          success: false,
          error: errorMessage,
          statusCode,
          details,
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }));
    }
  };

  const tests = [
    {
      name: "Health Check",
      fn: () => apiClient.healthCheck(),
    },
    {
      name: "Get Bookings",
      fn: () => apiClient.getBookings(),
    },
    {
      name: "Get Sleeping Accommodations",
      fn: () => apiClient.getSleepingAccommodations(),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Connection Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <dl className="grid grid-cols-1 gap-2">
            <div>
              <dt className="font-medium text-gray-600">API URL:</dt>
              <dd className="text-gray-900">{process.env.NEXT_PUBLIC_API_URL || "Not set"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{test.name}</h3>
                <button
                  onClick={() => testEndpoint(test.name, test.fn)}
                  disabled={loading[test.name]}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading[test.name] ? "Testing..." : "Test"}
                </button>
              </div>

              {(() => {
                const result = results[test.name];
                if (!result) return null;
                
                return (
                  <div
                    className={`p-4 rounded ${
                      result.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    {result.success ? (
                      <div>
                        <p className="text-green-700 font-semibold mb-2">Success!</p>
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <p className="text-red-700 font-semibold mb-2">Error</p>
                        <p className="text-red-600">{result.error}</p>
                        {result.statusCode && (
                          <p className="text-red-600">Status Code: {result.statusCode}</p>
                        )}
                        {result.details != null ? (
                          <pre className="text-xs overflow-auto mt-2">
                            {typeof result.details === 'string' 
                              ? result.details 
                              : JSON.stringify(result.details, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">
            <strong>Note:</strong> This is a development test page. Make sure the backend API is running.
          </p>
        </div>
      </div>
    </div>
  );
}