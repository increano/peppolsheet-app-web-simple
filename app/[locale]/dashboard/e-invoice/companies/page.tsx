"use client"

import React, { useState } from 'react'
import { BusinessManagement } from "@/components/dashboard/business"
import { AddNewBusinessContent } from "@/components/dashboard/add-new-business-content"
import { BulkImportContent } from "@/components/dashboard/bulk-import-content"
import { Button } from "@/components/ui/button"
import { List, Plus, Upload } from "lucide-react"

type ViewType = 'home' | 'new-company' | 'bulk-import'

export default function EInvoiceCompaniesPage() {
  const [currentView, setCurrentView] = useState<ViewType>('home')

  const menuItems = [
    {
      id: 'home' as ViewType,
      label: 'Company List',
      icon: List,
      description: 'View and manage all companies'
    },
    {
      id: 'new-company' as ViewType,
      label: 'Company',
      icon: Plus,
      description: 'Add a new company manually'
    },
    {
      id: 'bulk-import' as ViewType,
      label: 'Bulk Import',
      icon: Upload,
      description: 'Import multiple companies from CSV'
    }
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <BusinessManagement onNewCompany={() => setCurrentView('new-company')} onBulkImport={() => setCurrentView('bulk-import')} />
      case 'new-company':
        return <AddNewBusinessContent onClose={() => setCurrentView('home')} />
      case 'bulk-import':
        return <BulkImportContent onClose={() => setCurrentView('home')} />
      default:
        return <BusinessManagement onNewCompany={() => setCurrentView('new-company')} onBulkImport={() => setCurrentView('bulk-import')} />
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
