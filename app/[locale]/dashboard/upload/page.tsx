"use client"

import React from 'react'
import { BulkImportDocumentContent } from "@/components/dashboard/bulk-import-invoice-content"
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()

  const handleClose = () => {
    // Redirect back to overview page when closing
    router.push('/dashboard/overview')
  }

  return (
    <div className="min-h-screen">
      {/* Content Area */}
      
        <BulkImportDocumentContent onClose={handleClose} />
      
    </div>
  )
}
