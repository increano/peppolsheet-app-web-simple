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
  CalendarDays,
  ArrowUpDown,
  MoreHorizontal,
  Plus
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from './data-table'
import { supabase } from '@/lib/auth-context'

// Contact type definition
type Contact = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: string
  lastContact: string
  createdOn: string
  activity: string
  // Additional fields from database
  first_name?: string
  last_name?: string
  job_title?: string
  department?: string
  business_entity_id?: string
  is_primary?: boolean
  iban?: string
  swift?: string
  bank_account_number?: string
}

interface ContactManagementProps {
  onNewContact?: () => void
  refreshTrigger?: number // Add refresh trigger prop
}

export function ContactManagement({ onNewContact, refreshTrigger }: ContactManagementProps) {
  const [statusTabs, setStatusTabs] = useState([
    { id: 'active', name: 'Active', count: 0, icon: CheckCircle, isActive: true },
    { id: 'contacted', name: 'Recently Contacted', count: 0, icon: Mail, isActive: false },
    { id: 'archived', name: 'Archived', count: 0, icon: X, isActive: false }
  ])

  const [activeFilter, setActiveFilter] = useState('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState('10')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch contacts data
  useEffect(() => {
    fetchContacts()
  }, [])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchContacts()
    }
  }, [refreshTrigger])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching contacts...')
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('Error getting current user:', userError)
        return
      }

      // Get tenant_id for the user
      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', currentUser.id)
        .single()

      if (tenantError || !tenantUser) {
        console.error('Error getting tenant:', tenantError)
        return
      }

      // Fetch contacts with business entity information
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          *,
          business_entities!inner(
            id,
            names,
            tax_id
          )
        `)
        .eq('tenant_id', tenantUser.tenant_id)
        .order('created_at', { ascending: false })

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError)
        return
      }

      console.log('📊 Contacts fetched:', contactsData?.length || 0)

      // Transform data to match Contact type
      const transformedContacts: Contact[] = (contactsData || []).map((contact: any) => {
        const businessEntity = contact.business_entities
        const companyName = businessEntity?.names?.[0]?.name || 'Unknown Company'
        
        return {
          id: contact.id,
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Name',
          company: companyName,
          email: contact.email || '',
          phone: contact.phone || '',
          status: contact.status || 'Active',
          lastContact: new Date(contact.updated_at).toLocaleDateString(),
          createdOn: new Date(contact.created_at).toLocaleDateString(),
          activity: contact.is_primary ? 'Primary Contact' : 'Contact',
          // Additional fields
          first_name: contact.first_name,
          last_name: contact.last_name,
          job_title: contact.job_title,
          department: contact.department,
          business_entity_id: contact.business_entity_id,
          is_primary: contact.is_primary,
          iban: contact.iban,
          swift: contact.swift,
          bank_account_number: contact.bank_account_number
        }
      })

      setContacts(transformedContacts)
      
      // Update status tab counts
      const activeCount = transformedContacts.filter(c => c.status === 'active').length
      const contactedCount = transformedContacts.filter(c => c.status === 'contacted').length
      const archivedCount = transformedContacts.filter(c => c.status === 'archived').length
      
      setStatusTabs(prev => prev.map(tab => ({
        ...tab,
        count: tab.id === 'active' ? activeCount : 
               tab.id === 'contacted' ? contactedCount : 
               tab.id === 'archived' ? archivedCount : 0
      })))

    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Column definitions
  const columns: ColumnDef<Contact>[] = [
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
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize text-xs h-4 leading-4 px-2 py-0">
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "company",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Company
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("company")}</div>,
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
      cell: ({ row }) => (
        <div className="text-xs leading-[18px]">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Phone
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("phone")}</div>,
    },
    {
      accessorKey: "lastContact",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Last Contact
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("lastContact")}</div>,
    },
    {
      accessorKey: "activity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Activity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs leading-[18px]">{row.getValue("activity")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const contact = row.original

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
                onClick={() => navigator.clipboard.writeText(contact.email)}
              >
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View contact</DropdownMenuItem>
              <DropdownMenuItem>Edit contact</DropdownMenuItem>
              <DropdownMenuItem>Send e-invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const handleTabClick = (tabId: string) => {
    setActiveFilter(tabId)
    setStatusTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })))
  }

  return (
    <div className="min-h-[100vh] flex-1 bg-white md:min-h-min overflow-hidden">
      {/* Status Navigation Tabs */}
      <div className="flex border-b bg-gray-50 overflow-hidden">
        {/* Contact Icon */}
        <div className="flex items-center px-3 flex-shrink-0">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" />
          </svg>
        </div>

        <div className="flex items-center gap-1 p-1 overflow-x-auto min-w-0 w-0 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {statusTabs.map((tab) => {
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
                <IconComponent className="w-4 h-4 text-gray-500" />
                <span className={`text-sm ${tab.isActive ? 'font-medium text-gray-900' : ''}`}>
                  {tab.name}
                </span>
                <span className="text-sm text-gray-500">{tab.count} contacts</span>
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
                placeholder="Search contacts..."
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
      </div>

      {/* Data Table */}
      <div className="px-6 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading contacts...</div>
          </div>
        ) : (
          <DataTable columns={columns} data={contacts} pageSize={parseInt(rowsPerPage)} />
        )}
      </div>


    </div>
  )
}
