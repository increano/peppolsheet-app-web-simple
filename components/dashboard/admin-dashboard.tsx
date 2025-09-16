'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  Clock, 
  X, 
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Check,
  Ban,
  Edit
} from 'lucide-react'
import { ColumnDef } from "@tanstack/react-table"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useRoleAuth } from '@/lib/role-auth-context'
import { useToast } from '@/hooks/use-toast'
import { StagingEntity } from '@/lib/staging-service'

// Staging Entity type definition
type StagingEntityTable = {
  id: string
  name: string
  taxId: string
  location: string
  submittedAt: string
  sourceType: string
  adminNotes?: string
  originalEntity: StagingEntity
}

// Verified Entity type definition
type VerifiedEntityTable = {
  id: string
  name: string
  taxId: string
  location: string
  createdOn: string
  peppolId: string
  isStaging: false
}

export default function AdminDashboard() {
  const { roleUser, supabase } = useRoleAuth()
  const [stagingEntities, setStagingEntities] = useState<StagingEntity[]>([])
  const [allStagingEntities, setAllStagingEntities] = useState<StagingEntityTable[]>([])
  const [verifiedEntities, setVerifiedEntities] = useState<VerifiedEntityTable[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntity, setSelectedEntity] = useState<StagingEntity | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState('5')
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending')

  useEffect(() => {
    if (roleUser) {
      fetchStagingEntities()
      fetchVerifiedEntities()
    }
  }, [roleUser])

  const fetchStagingEntities = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/admin/staging', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch staging entities')
      }

      const data = await response.json()
      setStagingEntities(data.entities || [])
      
      // Transform data for table display
      const tableData: StagingEntityTable[] = (data.entities || []).map((entity: StagingEntity) => ({
        id: entity.id,
        name: entity.name || 'Unknown Company',
        taxId: entity.taxId || '',
        location: entity.billingCountry || 'Unknown',
        submittedAt: new Date(entity.submittedAt).toLocaleDateString(),
        sourceType: 'manual', // Default to manual since StagingEntity interface doesn't include sourceType
        adminNotes: entity.adminNotes,
        originalEntity: entity
      }))
      
      setAllStagingEntities(tableData)
    } catch (error) {
      console.error('Error fetching staging entities:', error)
      toast({
        title: "Error",
        description: "Failed to fetch staging entities",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVerifiedEntities = async () => {
    try {
      // Fetch verified entities directly from Supabase
      console.log('🔍 Fetching verified entities...')
      const { data: businessEntities, error: businessError } = await supabase
        .from('business_entities')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (businessError) {
        console.error('Error fetching business entities:', businessError)
        return
      }
      
      console.log('📊 Verified entities:', businessEntities)
      
      // Transform data for table display
      const tableData: VerifiedEntityTable[] = (businessEntities || []).map((entity: any) => ({
        id: entity.id,
        name: entity.names?.[0]?.name || 'Unknown Company',
        taxId: entity.tax_id || '',
        location: entity.company_country || 'Unknown',
        createdOn: new Date(entity.created_at).toLocaleDateString(),
        peppolId: entity.peppol_data?.[0]?.participant_id || '',
        isStaging: false
      }))
      
      setVerifiedEntities(tableData)
    } catch (error) {
      console.error('Error fetching verified entities:', error)
      toast({
        title: "Error",
        description: "Failed to fetch verified entities",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (entity: StagingEntity) => {
    try {
      setProcessing(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/admin/staging/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          stagingId: entity.id,
          notes: 'Approved via admin dashboard'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve entity')
      }

      toast({
        title: "Success",
        description: "Entity approved and moved to production",
      })

      // Refresh the list
      fetchStagingEntities()
    } catch (error) {
      console.error('Error approving entity:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve entity",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (entity: StagingEntity) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessing(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/admin/staging/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          stagingId: entity.id, 
          reason: rejectionReason 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject entity')
      }

      toast({
        title: "Success",
        description: "Entity rejected successfully",
      })

      // Reset and close dialog
      setRejectionReason('')
      setIsRejectDialogOpen(false)
      setSelectedEntity(null)

      // Refresh the list
      fetchStagingEntities()
    } catch (error) {
      console.error('Error rejecting entity:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject entity",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // Column definitions for staging entities
  const stagingColumns: ColumnDef<StagingEntityTable>[] = [
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
        const formattedTaxId = taxId ? taxId.replace(/[^\d]/g, '') : ''
        return (
          <div className="text-xs leading-[18px] font-mono">
            {formattedTaxId || <span className="text-gray-400">Not set</span>}
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
      accessorKey: "sourceType",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Source
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const sourceType = row.getValue("sourceType") as string
        return (
          <div className="text-xs leading-[18px]">
            <span className={`px-2 py-1 rounded-full text-xs ${
              sourceType === 'manual'
                ? 'bg-blue-100 text-blue-800'
                : sourceType === 'csv_import'
                ? 'bg-purple-100 text-purple-800'
                : sourceType === 'api'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {sourceType}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Submitted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("submittedAt")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const entity = row.original.originalEntity

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
                onClick={() => handleApprove(entity)}
                disabled={processing}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedEntity(entity)
                  setIsRejectDialogOpen(true)
                }}
                disabled={processing}
              >
                <Ban className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Column definitions for verified entities
  const verifiedColumns: ColumnDef<VerifiedEntityTable>[] = [
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
        const formattedTaxId = taxId ? taxId.replace(/[^\d]/g, '') : ''
        return (
          <div className="text-xs leading-[18px] font-mono">
            {formattedTaxId || <span className="text-gray-400">Not set</span>}
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
        return (
          <div className="text-xs leading-[18px] font-mono">
            {peppolId || <span className="text-gray-400">Not set</span>}
          </div>
        )
      },
    },
    {
      accessorKey: "createdOn",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("createdOn")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const entity = row.original

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
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="min-h-[100vh] flex-1 bg-white md:min-h-min overflow-hidden">
      {/* Status Navigation Tabs */}
      <div className="flex border-b bg-gray-50 overflow-hidden">
        {/* Admin Icon */}
        <div className="flex items-center px-3 flex-shrink-0">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="flex items-center gap-1 p-1 overflow-x-auto min-w-0 w-0 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-shrink-0 transition-colors ${
              activeTab === 'pending'
                ? 'bg-white border border-gray-200 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 text-gray-500" />
            <span className={`text-sm ${activeTab === 'pending' ? 'font-medium text-gray-900' : ''}`}>
              Pending Review
            </span>
            <span className="text-sm text-gray-500">{allStagingEntities.length} entities</span>
          </button>
          <button 
            onClick={() => setActiveTab('verified')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg flex-shrink-0 transition-colors ${
              activeTab === 'verified'
                ? 'bg-white border border-gray-200 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-gray-500" />
            <span className={`text-sm ${activeTab === 'verified' ? 'font-medium text-gray-900' : ''}`}>
              Verified Entities
            </span>
            <span className="text-sm text-gray-500">{verifiedEntities.length} entities</span>
          </button>
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
                placeholder="Search staging entities..."
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
        </div>
      </div>

      {/* Data Table */}
      <div className="px-6 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">
              {activeTab === 'pending' ? 'Loading staging entities...' : 'Loading verified entities...'}
            </span>
          </div>
        ) : (
          <>
            {activeTab === 'pending' ? (
              <DataTable<StagingEntityTable, unknown>
                columns={stagingColumns} 
                data={allStagingEntities} 
                pageSize={parseInt(rowsPerPage)} 
              />
            ) : (
              <DataTable<VerifiedEntityTable, unknown>
                columns={verifiedColumns} 
                data={verifiedEntities} 
                pageSize={parseInt(rowsPerPage)} 
              />
            )}
          </>
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Entity</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedEntity?.name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false)
                setSelectedEntity(null)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedEntity && handleReject(selectedEntity)}
              disabled={processing || !rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

