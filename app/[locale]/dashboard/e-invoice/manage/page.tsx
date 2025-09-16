"use client"

import React, { useState } from 'react'
import { ActivityDashboard } from "@/components/dashboard/manage-status"
import { AddNewInvoiceContent } from "@/components/dashboard/add-new-invoice-content"
import { BulkImportInvoiceContent } from "@/components/dashboard/bulk-import-invoice-content"
import { Button } from "@/components/ui/button"
import { List, Plus, Upload } from "lucide-react"

type ViewType = 'home' | 'new-invoice' | 'bulk-import'

export default function EInvoiceManagePage() {
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const menuItems = [
    {
      id: 'home' as ViewType,
      label: 'Document List',
      icon: List,
      description: 'View and manage all documents'
    },
    {
      id: 'new-invoice' as ViewType,
      label: 'Document',
      icon: Plus,
      description: 'Create a new invoice manually'
    },
    {
      id: 'bulk-import' as ViewType,
      label: 'Bulk Import',
      icon: Upload,
      description: 'Import multiple invoices from CSV'
    }
  ]

  const handleSaveSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    setCurrentView('home')
  }

  const renderCurrentView = () => {
    switch (currentView) {
        case 'home':
          return <ActivityDashboard
            onNewInvoice={() => setCurrentView('new-invoice')}
            onBulkImport={() => setCurrentView('bulk-import')}
            refreshTrigger={refreshTrigger}
          />
      case 'new-invoice':
        return <AddNewInvoiceContent 
          onClose={() => setCurrentView('home')} 
          onSaveSuccess={handleSaveSuccess}
        />
      case 'bulk-import':
        return <BulkImportInvoiceContent onClose={() => setCurrentView('home')} />
        default:
          return <ActivityDashboard
            onNewInvoice={() => setCurrentView('new-invoice')}
            onBulkImport={() => setCurrentView('bulk-import')}
            refreshTrigger={refreshTrigger}
          />
    }
  }

  return (
    <div className="min-h-screen">
      {/* Sub-menu Navigation */}
      <div className="bg-white border-b">
        <div className="px-0 py-0">
          <div className="flex items-center space-x-8">
            {menuItems.map((item) => {
              const IconComponent = item.icon
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-1 py-2 text-sm font-medium transition-colors relative ${
                    isActive 
                      ? 'text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {renderCurrentView()}
      </div>
    </div>
  )
}
