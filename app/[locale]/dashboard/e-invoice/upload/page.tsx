"use client"

import React from 'react'
import { BulkImportInvoiceContent } from "@/components/dashboard/bulk-import-invoice-content"
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()

  const handleClose = () => {
    // Redirect back to overview page when closing
    router.push('/dashboard/e-invoice/overview')
  }

  return (
    <div className="min-h-screen">
      {/* Content Area */}
      <div className="p-6">
        <BulkImportInvoiceContent onClose={handleClose} />
      </div>
    </div>
  )
}
