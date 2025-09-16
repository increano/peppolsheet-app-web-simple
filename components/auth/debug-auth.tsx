"use client"

import { useAuth } from '@/lib/auth-context'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'

export function DebugAuth() {
  const { user, session, loading, error, checkAuth } = useAuth()
  const params = useParams()
  const locale = params.locale as string || 'en'
  const [currentPath, setCurrentPath] = useState<string>('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setCurrentPath(window.location.pathname)
  }, [])

  if (process.env.NODE_ENV !== 'development' || !isClient) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 bg-white shadow-lg border-2 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-green-800">
          🐛 Auth Debug (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Locale:</strong> {locale}
        </div>
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {error || 'None'}
        </div>
        <div>
          <strong>User:</strong> {user ? user.email : 'None'}
        </div>
        <div>
          <strong>Tenant ID:</strong> {user?.tenantId || 'None'}
        </div>
        <div>
          <strong>Session:</strong> {session ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Current Path:</strong> {currentPath}
        </div>
        <Button 
          onClick={checkAuth} 
          size="sm" 
          className="w-full mt-2"
        >
          Refresh Auth
        </Button>
      </CardContent>
    </Card>
  )
} 