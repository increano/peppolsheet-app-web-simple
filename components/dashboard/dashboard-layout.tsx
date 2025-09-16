"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardSidebar } from './dashboard-sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="ml-0 md:ml-64 p-4 md:p-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
} 