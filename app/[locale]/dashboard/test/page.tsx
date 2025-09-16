"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"

export default function TestPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Test Page
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              This is a test page. Content coming soon...
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
