"use client"

import React, { useState } from 'react'
import AdminDashboard from '@/components/dashboard/admin-dashboard'
import { UserManagement } from '@/components/dashboard/user-management'
import { Button } from "@/components/ui/button"
import { List, Settings, Users, BarChart3 } from "lucide-react"

type ViewType = 'staging-list' | 'settings' | 'users' | 'analytics'

export default function AdminPage() {
  const [currentView, setCurrentView] = useState<ViewType>('staging-list')

  const menuItems = [
    {
      id: 'staging-list' as ViewType,
      label: 'Staging List',
      icon: List,
      description: 'Review and manage staging entities'
    },
    {
      id: 'users' as ViewType,
      label: 'Users',
      icon: Users,
      description: 'Manage user accounts and permissions'
    },
    {
      id: 'analytics' as ViewType,
      label: 'Analytics',
      icon: BarChart3,
      description: 'View system analytics and reports'
    },
    {
      id: 'settings' as ViewType,
      label: 'Settings',
      icon: Settings,
      description: 'Admin settings and configuration'
    }
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'staging-list':
        return <AdminDashboard />
      case 'settings':
        return (
          <div className="min-h-[100vh] flex-1 bg-white md:min-h-min overflow-hidden">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-500">Admin settings and configuration coming soon...</p>
              </div>
            </div>
          </div>
        )
      case 'users':
        return <UserManagement />
      case 'analytics':
        return (
          <div className="min-h-[100vh] flex-1 bg-white md:min-h-min overflow-hidden">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
                <p className="text-gray-500">System analytics and reports coming soon...</p>
              </div>
            </div>
          </div>
        )
      default:
        return <AdminDashboard />
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

