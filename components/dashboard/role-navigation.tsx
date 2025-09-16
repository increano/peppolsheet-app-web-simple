'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { detectUserRole, getRoleDisplayName, getRoleDescription, SystemRole } from '@/lib/role-detection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Users, 
  FileText, 
  Settings, 
  ArrowRight,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface RoleNavigationProps {
  className?: string
}

export default function RoleNavigation({ className }: RoleNavigationProps) {
  const [userRole, setUserRole] = useState<SystemRole>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.email) {
        const role = detectUserRole(session.user.email)
        setUserRole(role)
        setUserEmail(session.user.email)
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: SystemRole) => {
    switch (role) {
      case 'admin': return Shield
      case 'support': return Users
      default: return CheckCircle
    }
  }

  const getRoleColor = (role: SystemRole) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-50'
      case 'support': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getDashboardLink = (role: SystemRole) => {
    switch (role) {
      case 'admin': return '/dashboard/admin'
      case 'support': return '/dashboard/support'
      default: return '/dashboard'
    }
  }

  const getAvailableDashboards = (role: SystemRole) => {
    if (role === 'admin') {
      return [
        { name: 'Admin Dashboard', link: '/dashboard/admin', description: 'Entity review and system management' },
        { name: 'Support Dashboard', link: '/dashboard/support', description: 'User assistance and account management' }
      ]
    }
    
    const dashboardLink = getDashboardLink(role)
    const dashboardName = getRoleDisplayName(role)
    const dashboardDescription = getRoleDescription(role)
    
    return [{ name: `${dashboardName} Dashboard`, link: dashboardLink, description: dashboardDescription }]
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading role information...</div>
        </CardContent>
      </Card>
    )
  }

  if (!userRole) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Standard User Access
          </CardTitle>
          <CardDescription>
            You have standard user access to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Email: {userEmail}
            </div>
            <div className="text-sm text-muted-foreground">
              Access regular dashboard features and manage your business entities.
            </div>
            <Button className="w-full" asChild>
              <Link href="/dashboard/e-invoice/overview">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const RoleIcon = getRoleIcon(userRole)
  const roleColor = getRoleColor(userRole)
  const availableDashboards = getAvailableDashboards(userRole)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RoleIcon className="h-5 w-5" />
          {getRoleDisplayName(userRole)} Access
        </CardTitle>
        <CardDescription>
          {getRoleDescription(userRole)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={roleColor}>
                {userRole.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {userEmail}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Available Dashboards:</div>
            {availableDashboards.map((dashboard, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{dashboard.name}</div>
                    <div className="text-sm text-muted-foreground">{dashboard.description}</div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={dashboard.link}>
                      Access
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {userRole === 'admin' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Admin Capabilities:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full access to all system dashboards</li>
                <li>• Review and approve flagged business entities</li>
                <li>• Manage user accounts and system settings</li>
                <li>• View comprehensive audit logs</li>
                <li>• Perform all role-specific actions</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
