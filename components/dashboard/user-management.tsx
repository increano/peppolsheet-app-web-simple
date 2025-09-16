'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  Clock, 
  X, 
  Search,
  ArrowUpDown,
  MoreHorizontal,
  User,
  Users,
  Mail,
  Phone,
  Shield
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
import { supabase } from '@/lib/auth-context'

// User type definition
type UserTable = {
  id: string
  userId: string // UUID from auth.users
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  tenantId: string
  tenantName: string
  tenantSlug: string
  isActive: boolean
  joinedAt: string
  invitedAt: string
}

export function UserManagement() {
  const [allUsers, setAllUsers] = useState<UserTable[]>([]) // Original data
  const [filteredUsers, setFilteredUsers] = useState<UserTable[]>([]) // Filtered data for display
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState('5')
  const [activeFilter, setActiveFilter] = useState('all')

  const allStatusTabs = [
    { id: 'all', name: 'All', count: 0, icon: null, isActive: true },
    { id: 'active', name: 'Active', count: 0, icon: CheckCircle, isActive: false },
    { id: 'pending', name: 'Pending Actions', count: 0, icon: Clock, isActive: false },
    { id: 'recent', name: 'Recently Contacted', count: 0, icon: User, isActive: false },
    { id: 'archived', name: 'Archived', count: 0, icon: X, isActive: false }
  ]

  const [statusTabs, setStatusTabs] = useState(allStatusTabs)
  const [visibleTabs, setVisibleTabs] = useState(
    allStatusTabs.slice(0, 4).map(tab => tab.id)
  )

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch ALL users from tenant_users table with tenant information (admin view)
      const { data: tenantUsers, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenants (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error fetching users:', error)
        console.error('❌ Error details:', error.message, error.details, error.hint)
        return
      }
      
      console.log('📊 All Users (Admin View):', tenantUsers)
      console.log(`📊 Total users found: ${tenantUsers?.length || 0}`)
      
      if (!tenantUsers || tenantUsers.length === 0) {
        console.warn('⚠️ No users found - this might be a RLS policy issue')
        return
      }
      
      // Check if we're getting users from multiple tenants (admin access working)
      const uniqueTenants = new Set(tenantUsers?.map((u: any) => u.tenant_id) || [])
      console.log(`📊 Unique tenants represented: ${uniqueTenants.size}`)
      console.log(`📊 Tenant IDs:`, Array.from(uniqueTenants))
      
      // Transform data for table display - showing ALL users across ALL tenants
      console.log('🔄 Transforming user data...')
      const tableData: UserTable[] = (tenantUsers || []).map((user: any, index: number) => {
        console.log(`🔄 Processing user ${index + 1}:`, {
          id: user.id,
          userId: user.user_id,
          email: user.email,
          role: user.role,
          status: user.status,
          tenantName: user.tenants?.name
        })
        
        return {
          id: user.id,
          userId: user.user_id, // UUID from auth.users
          email: user.email,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          role: user.role || 'member',
          status: user.status || 'active',
          tenantId: user.tenant_id,
          tenantName: user.tenants?.name || 'Unknown Tenant',
          tenantSlug: user.tenants?.slug || '',
          isActive: user.status === 'active',
          joinedAt: user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A',
          invitedAt: user.invited_at ? new Date(user.invited_at).toLocaleDateString() : 'N/A'
        }
      })
      
      console.log('✅ Transformed table data:', tableData)
      
      setAllUsers(tableData)
      setFilteredUsers(tableData) // Initially show all users
      
      // Log summary for admin view
      console.log('📊 Admin User Summary:')
      console.log(`- Total users: ${tableData.length}`)
      console.log(`- Active users: ${tableData.filter(u => u.status === 'active').length}`)
      console.log(`- Unique tenants: ${new Set(tableData.map(u => u.tenantId)).size}`)
      
      // Update tab counts based on all users
      const counts = {
        all: tableData.length,
        active: tableData.filter(u => u.status === 'active').length,
        pending: tableData.filter(u => u.status === 'inactive').length,
        recent: tableData.filter(u => u.joinedAt !== 'N/A').length, // Use joinedAt instead of lastLogin
        archived: tableData.filter(u => u.status === 'suspended').length
      }

      setStatusTabs(prev => prev.map(tab => ({
        ...tab,
        count: counts[tab.id as keyof typeof counts] || 0
      })))
      
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter function
  const applyFilter = (filter: string, users: UserTable[]) => {
    let filtered: UserTable[] = []
    
    switch (filter) {
      case 'all':
        filtered = users
        break
      case 'active':
        filtered = users.filter(u => u.status === 'active')
        break
      case 'pending':
        filtered = users.filter(u => u.status === 'inactive')
        break
      case 'recent':
        // Filter users who have joined recently (within last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        filtered = users.filter(u => new Date(u.joinedAt) > thirtyDaysAgo)
        break
      case 'archived':
        filtered = users.filter(u => u.status === 'suspended')
        break
      default:
        filtered = users
    }
    
    return filtered
  }

  // Handle tab click
  const handleTabClick = (tabId: string) => {
    setActiveFilter(tabId)
    setStatusTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })))
  }

  // Handle search functionality
  useEffect(() => {
    console.log('🔍 Search/Filter effect triggered:', { searchQuery, activeFilter, allUsersLength: allUsers.length })
    
    if (allUsers.length > 0) {
      let filtered = allUsers
      console.log('🔍 Starting with allUsers:', filtered.length)

      // Apply search filter if search query exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        console.log('🔍 Applying search filter:', query)
        filtered = allUsers.filter(user => 
          user.email.toLowerCase().includes(query) ||
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query) ||
          user.tenantName.toLowerCase().includes(query) ||
          user.userId.toLowerCase().includes(query) ||
          user.tenantSlug.toLowerCase().includes(query)
        )
        console.log('🔍 After search filter:', filtered.length)
      }

      // Apply current tab filter
      const finalFiltered = applyFilter(activeFilter, filtered)
      console.log('🔍 After tab filter:', finalFiltered.length)
      setFilteredUsers(finalFiltered)
    }
  }, [searchQuery, activeFilter, allUsers])

  // Column definitions
  const columns: ColumnDef<UserTable>[] = [
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
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium text-xs leading-[18px]">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "firstName",
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
      cell: ({ row }) => {
        const firstName = row.getValue("firstName") as string
        const lastName = row.original.lastName
        const fullName = `${firstName} ${lastName}`.trim()
        return <div className="text-xs leading-[18px]">{fullName || 'N/A'}</div>
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <div className="text-xs leading-[18px]">
            <span className={`px-2 py-1 rounded-full text-xs ${
              role === 'owner'
                ? 'bg-purple-100 text-purple-800'
                : role === 'admin'
                ? 'bg-red-100 text-red-800'
                : role === 'member'
                ? 'bg-blue-100 text-blue-800'
                : role === 'viewer'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {role}
            </span>
          </div>
        )
      },
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
        const displayStatus = status === 'active' ? 'Active' : 
                             status === 'inactive' ? 'Pending Actions' : 
                             status === 'suspended' ? 'Archived' : 
                             status
        
        return (
          <div className="text-xs leading-[18px]">
            <span className={`px-2 py-1 rounded-full text-xs ${
              status === 'active'
                ? 'bg-green-100 text-green-800'
                : status === 'inactive'
                ? 'bg-yellow-100 text-yellow-800'
                : status === 'suspended'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {displayStatus}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "tenantName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Tenant
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const tenantName = row.getValue("tenantName") as string
        const tenantSlug = row.original.tenantSlug
        return (
          <div className="text-xs leading-[18px]">
            <div className="font-medium">{tenantName}</div>
            <div className="text-gray-500 font-mono">{tenantSlug}</div>
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original

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
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Edit Permissions
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Phone className="mr-2 h-4 w-4" />
                Contact User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const displayedTabs = statusTabs.filter(tab => visibleTabs.includes(tab.id))

  return (
    <div className="min-h-[100vh] flex-1 bg-white md:min-h-min overflow-hidden">
      {/* Status Navigation Tabs */}
      <div className="flex border-b bg-gray-50 overflow-hidden">
        {/* Users Icon */}
        <div className="flex items-center px-3 flex-shrink-0">
          <Users className="w-5 h-5 text-gray-600" />
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
                <span className="text-sm text-gray-500">{tab.count} users</span>
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
                placeholder="Search all users across all tenants..."
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
            <span className="ml-2 text-sm text-gray-600">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No users found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredUsers} pageSize={parseInt(rowsPerPage)} />
        )}
      </div>
    </div>
  )
}
