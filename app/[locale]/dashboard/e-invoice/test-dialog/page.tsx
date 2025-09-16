"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DocumentViewDialog } from '@/components/e-invoice/document-view-dialog'
import { Document } from '@/components/e-invoice/document-card'

export default function TestDialogPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const sampleDocument: Document = {
    id: '1',
    documentId: 'INV-2024-001',
    customerName: 'Acme Corporation',
    issueDate: '2024-01-15',
    amount: 1250.00,
    currency: 'EUR',
    status: 'draft',
    customerEmail: 'contact@acme.com',
    customerAddress: '123 Business Street, Brussels, Belgium',
    peppolId: 'BE:VAT:BE0123456789',
    peppolVerified: true,
    lastModified: '2024-01-15T10:30:00Z',
    dueDate: '2024-02-14',
    lineItemsCount: 3
  }

  const handleEdit = (doc: Document) => {
    console.log('Edit document:', doc)
    setIsDialogOpen(false)
  }

  const handleSend = (doc: Document) => {
    console.log('Send document:', doc)
    setIsDialogOpen(false)
  }

  const handleDuplicate = (doc: Document) => {
    console.log('Duplicate document:', doc)
    setIsDialogOpen(false)
  }

  const handleDelete = (doc: Document) => {
    console.log('Delete document:', doc)
    setIsDialogOpen(false)
  }

  const handleDownloadUBL = (doc: Document) => {
    console.log('Download UBL:', doc)
  }

  const handleViewUBL = (doc: Document) => {
    console.log('View UBL:', doc)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Document View Dialog Test</h1>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Document View Dialog</h2>
          <p className="text-gray-600 mb-6">
            Click the button below to open the document view dialog with sample data.
          </p>
          
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Open Document View Dialog
          </Button>
        </div>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Document Data</h3>
          <pre className="bg-gray-100 rounded p-4 text-sm overflow-auto">
            {JSON.stringify(sampleDocument, null, 2)}
          </pre>
        </div>
      </div>

      <DocumentViewDialog
        document={sampleDocument}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onEdit={handleEdit}
        onSend={handleSend}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onDownloadUBL={handleDownloadUBL}
        onViewUBL={handleViewUBL}
      />
    </div>
  )
}
