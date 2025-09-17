"use client"

import React, { useState } from 'react'
import { ActivityDashboard } from "@/components/dashboard/manage-status"
import { StatisticsGrid } from "@/components/dashboard/statistics-grid"
import { useRouter } from 'next/navigation'

export default function EInvoiceOverviewPage() {
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSaveSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen">
      {/* Statistics Grid */}
      <div className="mb-6">
        <StatisticsGrid />
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <ActivityDashboard
          onNewInvoice={() => router.push('/dashboard/e-invoice/add-new')}
          onBulkImport={() => router.push('/dashboard/e-invoice/upload')}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  )
}
