'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Key, Shield, HelpCircle } from 'lucide-react'

export default function SupportDashboard() {
  const [loading, setLoading] = useState(false)

  const supportStats = [
    {
      title: 'Total Users',
      value: '1,234',
      description: 'Active users in the system',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Password Resets',
      value: '45',
      description: 'This month',
      icon: Key,
      color: 'text-orange-600'
    },
    {
      title: 'Disabled Accounts',
      value: '12',
      description: 'Suspended accounts',
      icon: Shield,
      color: 'text-red-600'
    },
    {
      title: 'Support Tickets',
      value: '89',
      description: 'Open tickets',
      icon: HelpCircle,
      color: 'text-green-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Dashboard</h1>
        <p className="text-muted-foreground">
          User assistance and account management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {supportStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common support tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              View User Accounts
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Key className="mr-2 h-4 w-4" />
              Reset User Password
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Disable User Account
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <HelpCircle className="mr-2 h-4 w-4" />
              Manage Support Tickets
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest support actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Password Reset</Badge>
                  <span className="text-sm">user@example.com</span>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Account Disabled</Badge>
                  <span className="text-sm">spam@example.com</span>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">User Data Viewed</Badge>
                  <span className="text-sm">support@example.com</span>
                </div>
                <span className="text-xs text-muted-foreground">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

