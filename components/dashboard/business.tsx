"use client"

import React, { useState, useEffect } from 'react'
import { 
  Play, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  X, 
  Send, 
  Mail, 
  Ban, 
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Upload
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

import { supabase } from '@/lib/auth-context'

// Business type definition
type Business = {
  id: string
  name: string
  type: string
  location: string
  status: string // "Verified" or "Unverified" based on PEPPOL ID
  taxId: string // Tax ID (10-digit number)
  createdOn: string
  peppolId: string
  isStaging?: boolean // Flag to identify staging entities
}

interface BusinessManagementProps {
  onNewCompany?: () => void
  onBulkImport?: () => void
}

export function BusinessManagement({ onNewCompany, onBulkImport }: BusinessManagementProps = {}) {
  const allStatusTabs = [
    { id: 'all', name: 'All', count: 0, icon: null, isActive: true },
    { id: 'active', name: 'Active', count: 0, icon: CheckCircle, isActive: false },
    { id: 'pending', name: 'Pending', count: 0, icon: Clock, isActive: false },
    { id: 'peppol-enabled', name: 'PEPPOL Enabled', count: 0, icon: Send, isActive: false }
  ]

  const [statusTabs, setStatusTabs] = useState(allStatusTabs)
  const [visibleTabs, setVisibleTabs] = useState(
    allStatusTabs.slice(0, 4).map(tab => tab.id) // Show all 4 tabs by default
  )
  const [showModal, setShowModal] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const [rowsPerPage, setRowsPerPage] = useState('5')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  // Sample data for fallback (when API fails)
  const sampleBusinesses: Business[] = []

  // Fetch business data including staging entities
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true)
        
        // Fetch business entities directly from Supabase
        console.log('🔍 Fetching business entities...')
        const { data: businessEntities, error: businessError } = await supabase
          .from('business_entities')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (businessError) {
          console.error('Error fetching business entities:', businessError)
        }
        
        console.log('📊 Business entities:', businessEntities)
        
        let existingBusinesses: Business[] = (businessEntities || []).map((entity: any) => {
          const peppolId = entity.peppol_data?.[0]?.participant_id || ''
          console.log(`🔍 Company ${entity.names?.[0]?.name}: peppol_data=`, entity.peppol_data, 'peppolId=', peppolId)
          
          return {
            id: entity.id,
            name: entity.names?.[0]?.name || 'Unknown Company',
            type: 'Business',
            location: entity.company_country || 'Unknown',
            status: 'verified', // Companies from business_entities table are always verified
            taxId: entity.tax_id || '',
            createdOn: new Date(entity.created_at).toLocaleDateString(),
            peppolId: peppolId,
            isStaging: false
          }
        })

        // Fetch staging entities directly from Supabase
        console.log('🔍 Fetching staging entities...')
        const { data: stagingEntities, error: stagingError } = await supabase
          .from('business_entities_staging')
          .select('*')
          .order('submitted_at', { ascending: false })
        
        if (stagingError) {
          console.error('❌ Error fetching staging entities:', stagingError)
          console.error('❌ Error details:', stagingError.message, stagingError.details, stagingError.hint)
        } else {
          console.log('✅ Staging entities fetched successfully')
        }
        
        console.log('📊 Staging entities raw data:', stagingEntities)
        console.log('📊 Staging entities count:', stagingEntities?.length || 0)
        
        // Debug: Check if staging entities have the expected structure
        if (stagingEntities && stagingEntities.length > 0) {
          console.log('🔍 First staging entity structure:', stagingEntities[0])
          console.log('🔍 First staging entity names field:', stagingEntities[0].names)
        }
        
        let stagingBusinesses: Business[] = (stagingEntities || []).map((entity: any) => {
          const mappedEntity = {
            id: `staging-${entity.id}`,
            name: entity.names?.[0]?.name || 'Unknown Company',
            type: 'Staging',
            location: entity.company_country || 'Unknown',
            status: 'pending',
            taxId: entity.tax_id || '',
            createdOn: new Date(entity.submitted_at).toLocaleDateString(),
            peppolId: entity.peppol_data?.[0]?.participant_id || '',
            isStaging: true
          }
          console.log('🔍 Mapped staging entity:', mappedEntity)
          return mappedEntity
        })
        
        // Combine staging and existing businesses (staging first)
        const allBusinesses = [...stagingBusinesses, ...existingBusinesses]
        console.log('📊 Total businesses to display:', allBusinesses.length)
        console.log('📊 Staging businesses:', stagingBusinesses.length)
        console.log('📊 Existing businesses:', existingBusinesses.length)
        console.log('📊 All businesses array:', allBusinesses)
        
        setAllBusinesses(allBusinesses)
        setBusinesses(allBusinesses) // Initially show all
        
      } catch (error) {
        console.error('Error fetching business data:', error)
        // Fallback to empty array
        setBusinesses([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchBusinessData()
  }, [])

  // Update tab counts and apply filtering when allBusinesses changes
  useEffect(() => {
    if (allBusinesses.length > 0) {
      // Calculate counts for each tab
      const counts = {
        all: allBusinesses.length,
        active: allBusinesses.filter(b => !b.isStaging).length,
        pending: allBusinesses.filter(b => b.isStaging).length,
        'peppol-enabled': allBusinesses.filter(b => b.peppolId && b.peppolId.trim() !== '').length
      }

      // Update tab counts
      setStatusTabs(prev => prev.map(tab => ({
        ...tab,
        count: counts[tab.id as keyof typeof counts] || 0
      })))

      // Apply current filter
      applyFilter(activeFilter, allBusinesses)
    }
  }, [allBusinesses, activeFilter])

  // Handle search functionality
  useEffect(() => {
    if (allBusinesses.length > 0) {
      let filtered = allBusinesses

      // Apply search filter if search query exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filtered = allBusinesses.filter(business => 
          business.name.toLowerCase().includes(query) ||
          business.taxId.toLowerCase().includes(query) ||
          business.location.toLowerCase().includes(query) ||
          business.peppolId.toLowerCase().includes(query)
        )
      }

      // Apply current tab filter
      applyFilter(activeFilter, filtered)
    }
  }, [searchQuery, allBusinesses, activeFilter])

  // Filter function
  const applyFilter = (filter: string, businesses: Business[]) => {
    let filtered: Business[] = []
    
    switch (filter) {
      case 'all':
        filtered = businesses
        break
      case 'active':
        filtered = businesses.filter(b => !b.isStaging)
        break
      case 'pending':
        filtered = businesses.filter(b => b.isStaging)
        break
      case 'peppol-enabled':
        filtered = businesses.filter(b => b.peppolId && b.peppolId.trim() !== '')
        break
      default:
        filtered = businesses
    }
    
    setBusinesses(filtered)
  }

  // Handle tab click
  const handleTabClick = (tabId: string) => {
    setActiveFilter(tabId)
    setStatusTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })))
    applyFilter(tabId, allBusinesses)
  }

  // Column definitions
  const columns: ColumnDef<Business>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium text-xs leading-[18px]">{row.getValue("name")}</div>,
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
        
        // Convert status to display labels
        const displayStatus = status === 'verified' ? 'Verified' : 
                             status === 'pending' ? 'Pending Review' : 
                             status
        
        return (
          <div className="text-xs leading-[18px]">
            <span className={`px-2 py-1 rounded-full text-xs ${
              status === 'verified'
                ? 'bg-green-100 text-green-800'
                : status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {displayStatus}
            </span>
          </div>
        )
      },
    },



    {
      accessorKey: "location",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Location
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px] font-mono">{row.getValue("location")}</div>,
    },
    {
      accessorKey: "taxId",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Business ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const taxId = row.getValue("taxId") as string
        // Format tax ID: remove any dots, spaces, or special characters, keep only digits
        const formattedTaxId = taxId ? taxId.replace(/[^\d]/g, '') : ''
        return (
          <div className="text-xs leading-[18px] font-mono">
            {formattedTaxId || <span className="text-gray-400">Not set</span>}
          </div>
        )
      },
    },
    {
      accessorKey: "peppolId",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            PEPPOL ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const peppolId = row.getValue("peppolId") as string
        console.log(`🔍 Table cell for ${row.original.name}: peppolId=`, peppolId)
        return (
          <div className="text-xs leading-[18px] font-mono">
            {peppolId || <span className="text-gray-400">Not set</span>}
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const business = row.original

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
                onClick={() => navigator.clipboard.writeText(business.name)}
              >
                Copy name
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View business</DropdownMenuItem>
              <DropdownMenuItem>Edit business</DropdownMenuItem>
              <DropdownMenuItem>Send e-invoice</DropdownMenuItem>
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

  const displayedTabs = statusTabs.filter(tab => visibleTabs.includes(tab.id))

  return (
    <div className="min-h-[100vh] flex-1 bg-white md:min-h-min overflow-hidden">
      {/* Status Navigation Tabs */}
      <div className="flex border-b bg-gray-50 overflow-hidden">
        {/* Business Icon */}
        <div className="flex items-center px-3 flex-shrink-0">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
          </svg>
        </div>

        <div className="flex items-center gap-1 p-1 overflow-x-auto min-w-0 w-0 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {displayedTabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-shrink-0 transition-colors ${
                  tab.isActive 
                    ? 'bg-white border border-gray-200 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {IconComponent && <IconComponent className="w-4 h-4 text-gray-500" />}
                <span className={`text-sm ${tab.isActive ? 'font-medium text-gray-900' : ''}`}>
                  {tab.name}
                </span>
                <span className="text-sm text-gray-500">{tab.count} businesses</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              className="flex items-center gap-2"
              onClick={onNewCompany}
            >
              <Plus className="w-4 h-4" />
              New Company
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={onBulkImport}
            >
              <Upload className="w-4 h-4" />
              Bulk Import
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="px-6 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading business data...</span>
          </div>
        ) : (
          <>
            {console.log('🎯 Rendering DataTable with businesses:', businesses)}
            {console.log('🎯 Businesses length:', businesses.length)}
            {console.log('🎯 First business:', businesses[0])}
            <DataTable columns={columns} data={businesses} pageSize={parseInt(rowsPerPage)} />
          </>
        )}
      </div>

      {/* Status Tabs Selector Modal */}
      <StatusTabsSelector
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        allTabs={allStatusTabs}
        visibleTabs={visibleTabs}
        onToggleTab={toggleTabVisibility}
        onReorderTabs={handleReorderTabs}
        title="Customize Business Tabs"
        itemType="contacts"
      />


    </div>
  )
}
