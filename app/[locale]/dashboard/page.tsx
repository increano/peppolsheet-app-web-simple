"use client"

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    // Redirect to overview page
    router.replace(`/${locale}/dashboard/overview`)
  }, [router, locale])

  // Return null since we're redirecting
  return null
}