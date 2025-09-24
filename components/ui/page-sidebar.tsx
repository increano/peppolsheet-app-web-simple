"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"

export interface SidebarItem {
  id: string
  name: string
  icon: LucideIcon
  description: string
}

interface PageSidebarProps {
  title: string
  items: SidebarItem[]
  activeItem: string
  onItemClick: (itemId: string) => void
  children: React.ReactNode
  contentClassName?: string
}

export function PageSidebar({ 
  title, 
  items, 
  activeItem, 
  onItemClick, 
  children,
  contentClassName = ""
}: PageSidebarProps) {
  return (
    <div className="flex gap-4" style={{ minHeight: '80vh' }}>
      {/* Left Sidebar - Navigation */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 p-4 min-h-full">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 tracking-wide">
            {title}
          </h3>
        </div>
        
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <button
                key={item.id}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => onItemClick(item.id)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Right Content Area */}
      <div className={`flex-1 ${contentClassName}`}>
        {children}
      </div>
    </div>
  )
}
