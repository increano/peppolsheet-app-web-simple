"use client"

import React from 'react'
import { AddNewBusinessContent } from '@/components/dashboard/add-new-business-content'

export default function OrganizationSearchPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Organization Search</h1>
        <p className="text-sm text-gray-600 mt-1">
          Search for organizations and add them to your directory
        </p>
      </div>

      {/* Add New Business Content Component */}
      <AddNewBusinessContent />
    </div>
  )
}
