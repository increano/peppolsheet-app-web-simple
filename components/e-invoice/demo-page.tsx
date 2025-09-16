"use client"

import React, { useState } from 'react'
import { DocumentGrid } from './document-grid'
import { Document } from './document-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Send, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'

// Sample data for demonstration
const sampleDocuments: Document[] = [
  {
    id: '1',
    documentId: 'INV-2024-001',
    customerName: 'Acme Corporation',
    issueDate: '2024-01-15',
    amount: 1250.00,
    currency: 'EUR',
    status: 'draft',
    customerEmail: 'contact@acme.com',
    peppolId: 'BE:VAT:BE0123456789',
    peppolVerified: true,
    lastModified: '2024-01-15T10:30:00Z',
    lineItemsCount: 3
  },
  {
    id: '2',
    documentId: 'INV-2024-002',
    customerName: 'Beta Solutions Ltd',
    issueDate: '2024-01-16',
    amount: 890.50,
    currency: 'EUR',
    status: 'sent',
    customerEmail: 'billing@beta.com',
    peppolId: 'FR:VAT:FR98765432101',
    peppolVerified: true,
    lastModified: '2024-01-16T14:20:00Z',
    lineItemsCount: 2
  },
  {
    id: '3',
    documentId: 'INV-2024-003',
    customerName: 'Gamma Industries',
    issueDate: '2024-01-17',
    amount: 2100.00,
    currency: 'USD',
    status: 'delivered',
    customerEmail: 'finance@gamma.com',
    peppolId: 'US:EIN:12-3456789',
    peppolVerified: true,
    lastModified: '2024-01-17T09:15:00Z',
    lineItemsCount: 5
  },
  {
    id: '4',
    documentId: 'INV-2024-004',
    customerName: 'Delta Services',
    issueDate: '2024-01-18',
    amount: 450.75,
    currency: 'EUR',
    status: 'failed',
    customerEmail: 'admin@delta.com',
    peppolId: 'DE:VAT:DE123456789',
    peppolVerified: false,
    lastModified: '2024-01-18T16:45:00Z',
    lineItemsCount: 1
  },
  {
    id: '5',
    documentId: 'INV-2024-005',
    customerName: 'Epsilon Corp',
    issueDate: '2024-01-19',
    amount: 3200.00,
    currency: 'EUR',
    status: 'paid',
    customerEmail: 'payments@epsilon.com',
    peppolId: 'NL:VAT:NL123456789B01',
    peppolVerified: true,
    lastModified: '2024-01-19T11:30:00Z',
    lineItemsCount: 4
  },
  {
    id: '6',
    documentId: 'INV-2024-006',
    customerName: 'Zeta Technologies',
    issueDate: '2024-01-20',
    amount: 750.25,
    currency: 'EUR',
    status: 'pending',
    customerEmail: 'billing@zeta.com',
    peppolId: 'IT:VAT:IT12345678901',
    peppolVerified: true,
    lastModified: '2024-01-20T13:20:00Z',
    lineItemsCount: 2
  }
]

export function EInvoiceDemoPage() {
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments)
  const [loading, setLoading] = useState(false)

  // Handle individual document actions
  const handleEdit = (document: Document) => {
    console.log('Edit document:', document)
    // In a real app, this would open an edit modal or navigate to edit page
  }

  const handleView = (document: Document) => {
    console.log('View document:', document)
    // In a real app, this would open a view modal or navigate to view page
  }

  const handleSend = (document: Document) => {
    console.log('Send document:', document)
    // In a real app, this would trigger the send workflow
    setLoading(true)
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => 
        doc.id === document.id 
          ? { ...doc, status: 'sent' as const, lastModified: new Date().toISOString() }
          : doc
      ))
      setLoading(false)
    }, 2000)
  }

  const handleDuplicate = (document: Document) => {
    console.log('Duplicate document:', document)
    const newDocument: Document = {
      ...document,
      id: (documents.length + 1).toString(),
      documentId: `${document.documentId}-COPY`,
      status: 'draft',
      lastModified: new Date().toISOString()
    }
    setDocuments(prev => [newDocument, ...prev])
  }

  const handleDelete = (document: Document) => {
    console.log('Delete document:', document)
    setDocuments(prev => prev.filter(doc => doc.id !== document.id))
  }

  const handleDownloadUBL = (document: Document) => {
    console.log('Download UBL for document:', document)
    // In a real app, this would download the UBL XML file
  }

  const handleViewUBL = (document: Document) => {
    console.log('View UBL for document:', document)
    // In a real app, this would open a UBL preview modal
  }

  // Handle bulk actions
  const handleBulkSend = (selectedDocuments: Document[]) => {
    console.log('Bulk send documents:', selectedDocuments)
    setLoading(true)
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => 
        selectedDocuments.some(selected => selected.id === doc.id)
          ? { ...doc, status: 'sent' as const, lastModified: new Date().toISOString() }
          : doc
      ))
      setLoading(false)
    }, 2000)
  }

  const handleBulkExport = (selectedDocuments: Document[]) => {
    console.log('Bulk export documents:', selectedDocuments)
    // In a real app, this would export the selected documents
  }

  const handleBulkDelete = (selectedDocuments: Document[]) => {
    console.log('Bulk delete documents:', selectedDocuments)
    const idsToDelete = new Set(selectedDocuments.map(doc => doc.id))
    setDocuments(prev => prev.filter(doc => !idsToDelete.has(doc.id)))
  }

  // Get status counts for overview
  const statusCounts = documents.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalAmount = documents.reduce((sum, doc) => sum + doc.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">E-Invoice Management</h1>
            <p className="text-gray-600 mt-1">Create, edit, and manage your electronic invoices</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{totalAmount.toLocaleString('en-EU', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Send className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.draft || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.sent || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Legend</CardTitle>
            <CardDescription>Understanding document statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                <span className="text-sm text-gray-600">Ready for editing</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                <span className="text-sm text-gray-600">Validation in progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">Validated</Badge>
                <span className="text-sm text-gray-600">Ready to send</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
                <span className="text-sm text-gray-600">Transmitted via PEPPOL</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                <span className="text-sm text-gray-600">Successfully delivered</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800">Failed</Badge>
                <span className="text-sm text-gray-600">Transmission failed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-purple-100 text-purple-800">Paid</Badge>
                <span className="text-sm text-gray-600">Payment received</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Grid */}
        <DocumentGrid
          documents={documents}
          loading={loading}
          onEdit={handleEdit}
          onView={handleView}
          onSend={handleSend}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onDownloadUBL={handleDownloadUBL}
          onViewUBL={handleViewUBL}
          onBulkSend={handleBulkSend}
          onBulkExport={handleBulkExport}
          onBulkDelete={handleBulkDelete}
        />
      </div>
    </div>
  )
}
