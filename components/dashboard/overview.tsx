"use client"

import React, { useState } from 'react'
import { 
  Play, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Eye, 
  ShieldCheck, 
  X, 
  Send, 
  Mail, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Ban, 
  Flag, 
  FileEdit,
  Search,
  CalendarDays,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { StatusTabsSelector } from './status-tabs-selector'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from './data-table'

// Activity type definition
type Activity = {
  id: string
  type: string
  description: string
  entity: string
  status: string
  timestamp: string
  user: string
  priority: string
}

export function DocumentManagement() {
  const allStatusTabs = [
    { id: 'recent', name: 'Recent Activity', count: 25, icon: Clock, isActive: true },
    { id: 'alerts', name: 'Alerts', count: 3, icon: AlertTriangle, isActive: false },
    { id: 'pending', name: 'Pending Actions', count: 8, icon: Play, isActive: false },
    { id: 'completed', name: 'Completed Today', count: 12, icon: CheckCircle, isActive: false },
    { id: 'notifications', name: 'Notifications', count: 5, icon: Mail, isActive: false },
    { id: 'system', name: 'System Events', count: 7, icon: Eye, isActive: false },
    { id: 'errors', name: 'Errors', count: 1, icon: X, isActive: false },
    { id: 'payments', name: 'Payment Updates', count: 4, icon: DollarSign, isActive: false }
  ]

  const [visibleTabs, setVisibleTabs] = useState(
    allStatusTabs.slice(0, 6).map(tab => tab.id) // Show first 6 tabs by default
  )
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState('10')

  // Sample data
  const activities: Activity[] = [
    {
      id: "1",
      type: "Invoice",
      description: "Invoice INV-2025-001 created",
      entity: "Acme Corporation",
      status: "Success",
      timestamp: "2 minutes ago",
      user: "John Smith",
      priority: "Normal"
    },
    {
      id: "2",
      type: "Payment",
      description: "Payment received for INV-2025-002",
      entity: "TechStart Inc",
      status: "Success",
      timestamp: "15 minutes ago",
      user: "System",
      priority: "High"
    },
    {
      id: "3",
      type: "Contact",
      description: "New contact added",
      entity: "Global Solutions Ltd",
      status: "Success",
      timestamp: "1 hour ago",
      user: "Sarah Johnson",
      priority: "Normal"
    },
    {
      id: "4",
      type: "Alert",
      description: "Invoice overdue reminder sent",
      entity: "Beta Corp",
      status: "Warning",
      timestamp: "2 hours ago",
      user: "System",
      priority: "High"
    }
  ]

  // Column definitions
  const columns: ColumnDef<Activity>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs h-4 leading-4 px-2 py-0">
          {row.getValue("type")}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Description
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("description")}</div>,
    },
    {
      accessorKey: "entity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Entity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("entity")}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const getStatusStyle = (status: string) => {
          switch (status) {
            case "Success":
              return "bg-green-100 text-green-800 border-green-200"
            case "Warning":
              return "bg-yellow-100 text-yellow-800 border-yellow-200"
            default:
              return "bg-gray-100 text-gray-700 border-gray-200"
          }
        }
        return (
          <Badge variant="outline" className={`text-xs h-4 leading-4 px-2 py-0 ${getStatusStyle(status)}`}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Time
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("timestamp")}</div>,
    },
    {
      accessorKey: "user",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            User
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("user")}</div>,
    },
    {
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string
        const getPriorityStyle = (priority: string) => {
          switch (priority) {
            case "High":
              return "bg-red-100 text-red-800 border-red-200"
            case "Normal":
              return "bg-blue-100 text-blue-800 border-blue-200"
            default:
              return "bg-gray-100 text-gray-700 border-gray-200"
          }
        }
        return (
          <Badge variant="outline" className={`text-xs h-4 leading-4 px-2 py-0 ${getPriorityStyle(priority)}`}>
            {priority}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const activity = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(activity.id)}
              >
                Copy activity ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Mark as read</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const toggleTabVisibility = (tabId: string) => {
    setVisibleTabs(prev => {
      const isCurrentlyVisible = prev.includes(tabId)
      
      if (isCurrentlyVisible && prev.length <= 4) {
        // Don't allow hiding if it would result in less than 4 tabs
        return prev
      }
      
      if (isCurrentlyVisible) {
        return prev.filter(id => id !== tabId)
      } else {
        return [...prev, tabId]
      }
    })
  }

  const handleReorderTabs = (newOrder: string[]) => {
    // Update the allStatusTabs order based on the new order
    const reorderedTabs = newOrder.map(id => allStatusTabs.find(tab => tab.id === id)).filter(Boolean)
    // Note: In a real app, you might want to persist this order to localStorage or backend
    console.log('New tab order:', newOrder)
  }

  const displayedTabs = allStatusTabs.filter(tab => visibleTabs.includes(tab.id))

  return (
    <div className="min-h-[100vh] flex-1 rounded-xl bg-white border md:min-h-min overflow-hidden">
      {/* Status Navigation Tabs */}
      <div className="flex border-b bg-gray-50 rounded-t-xl overflow-hidden">
        {/* Left Chevron */}
        <div className="flex items-center px-2 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-1 p-1 overflow-x-auto min-w-0 w-0 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {displayedTabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <div 
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-shrink-0 ${
                  tab.isActive 
                    ? 'bg-white border border-gray-200 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4 text-gray-500" />
                <span className={`text-sm ${tab.isActive ? 'font-medium text-gray-900' : ''}`}>
                  {tab.name}
                </span>
                <span className="text-sm text-gray-500">{tab.count} documents</span>
              </div>
            )
          })}
        </div>
        {/* Right Chevron */}
        <div className="flex items-center px-2 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div className="ml-auto flex items-center px-4 flex-shrink-0">
          <button 
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => setShowModal(true)}
          >
            Customize
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search e-invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          
          {/* Date Range Picker Button */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Date Range
            </Button>
            
            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <Input type="date" className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <Input type="date" className="w-full" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => setShowDatePicker(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => setShowDatePicker(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rows per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows:</span>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="w-20 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="px-6 pb-4">
        <DataTable columns={columns} data={activities} pageSize={parseInt(rowsPerPage)} />
      </div>

      {/* Status Tabs Selector Modal */}
      <StatusTabsSelector
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        allTabs={allStatusTabs}
        visibleTabs={visibleTabs}
        onToggleTab={toggleTabVisibility}
        onReorderTabs={handleReorderTabs}
        title="Customize Overview Tabs"
      />
    </div>
  )
}
