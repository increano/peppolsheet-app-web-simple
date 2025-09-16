"use client"

import React, { useState, useMemo } from 'react'
import { DocumentCard, Document } from './document-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  CheckSquare,
  Square,
  Send,
  Download,
  Trash2
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DocumentGridProps {
  documents: Document[]
  onEdit?: (document: Document) => void
  onView?: (document: Document) => void
  onSend?: (document: Document) => void
  onDuplicate?: (document: Document) => void
  onDelete?: (document: Document) => void
  onDownloadUBL?: (document: Document) => void
  onViewUBL?: (document: Document) => void
  onBulkSend?: (documents: Document[]) => void
  onBulkExport?: (documents: Document[]) => void
  onBulkDelete?: (documents: Document[]) => void
  loading?: boolean
  className?: string
}

type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | Document['status']

export function DocumentGrid({
  documents,
  onEdit,
  onView,
  onSend,
  onDuplicate,
  onDelete,
  onDownloadUBL,
  onViewUBL,
  onBulkSend,
  onBulkExport,
  onBulkDelete,
  loading = false,
  className = ''
}: DocumentGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchQuery === '' || 
        doc.documentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [documents, searchQuery, statusFilter])

  // Handle document selection
  const handleSelectDocument = (documentId: string, selected: boolean) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(documentId)
      } else {
        newSet.delete(documentId)
      }
      return newSet
    })
  }

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)))
    } else {
      setSelectedDocuments(new Set())
    }
  }

  // Get selected documents
  const selectedDocumentsList = useMemo(() => {
    return documents.filter(doc => selectedDocuments.has(doc.id))
  }, [documents, selectedDocuments])

  // Handle bulk actions
  const handleBulkAction = (action: 'send' | 'export' | 'delete') => {
    if (selectedDocumentsList.length === 0) return

    switch (action) {
      case 'send':
        onBulkSend?.(selectedDocumentsList)
        break
      case 'export':
        onBulkExport?.(selectedDocumentsList)
        break
      case 'delete':
        onBulkDelete?.(selectedDocumentsList)
        break
    }
    
    setSelectedDocuments(new Set())
  }

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
  }

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all'
  const allSelected = filteredDocuments.length > 0 && selectedDocuments.size === filteredDocuments.length
  const someSelected = selectedDocuments.size > 0 && selectedDocuments.size < filteredDocuments.length

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
              <div className="border-t border-gray-200 mb-3"></div>
              <div className="space-y-2 mb-3">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="border-t border-gray-200 mb-3"></div>
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}

          {/* View Toggle */}
          <div className="flex items-center space-x-1 border border-gray-200 rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedDocuments.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocuments(new Set())}
                >
                  <Square className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-blue-900">
                  {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('send')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Send className="w-4 h-4 mr-1" />
                Send All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Select All Bar */}
      {filteredDocuments.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectAll(!allSelected)}
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : someSelected ? (
                <div className="w-4 h-4 border-2 border-gray-400 rounded bg-white"></div>
              ) : (
                <Square className="w-4 h-4" />
              )}
            </Button>
            <span className="text-sm text-gray-600">
              {allSelected ? 'All selected' : someSelected ? `${selectedDocuments.size} selected` : 'Select all'}
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </div>
        </div>
      )}

      {/* Documents Grid/List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {hasActiveFilters ? 'No documents match your filters' : 'No documents found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your search criteria or clear the filters.'
              : 'Create your first invoice to get started.'
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
        }>
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              isSelected={selectedDocuments.has(document.id)}
              onSelect={handleSelectDocument}
              onEdit={onEdit}
              onView={onView}
              onSend={onSend}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onDownloadUBL={onDownloadUBL}
              onViewUBL={onViewUBL}
              className={viewMode === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}
