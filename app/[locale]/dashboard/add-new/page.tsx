"use client"

import React from 'react'
import { AddNewInvoiceContent } from "@/components/dashboard/add-new-invoice-content"
import { useRouter } from 'next/navigation'

export default function AddNewPage() {
  const router = useRouter()

  const handleSaveSuccess = () => {
    // Redirect back to overview page after successful save
    router.push('/dashboard/overview')
  }

  const handleClose = () => {
    // Redirect back to overview page when closing
    router.push('/dashboard/overview')
  }

  return (
    <div className="min-h-screen">
      {/* Content Area */}
      
        <AddNewInvoiceContent 
          onClose={handleClose} 
          onSaveSuccess={handleSaveSuccess}
        />
      
    </div>
  )
}
