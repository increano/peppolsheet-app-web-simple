"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTenant } from '@/hooks/use-tenant'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Globe,
  Save,
  Edit,
  Settings,
  Users,
  BarChart3,
  Crown
} from 'lucide-react'
import { PageSidebar, SidebarItem } from '@/components/ui/page-sidebar'

type SettingsViewType = 'account' | 'preferences' | 'notifications' | 'organisation' | 'team' | 'usage' | 'upgrade-plan'

export default function SettingsPage() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const searchParams = useSearchParams()
  const [currentView, setCurrentView] = useState<SettingsViewType>('account')

  // Handle URL parameter to set initial view
  useEffect(() => {
    const view = searchParams.get('view') as SettingsViewType
    if (view && ['account', 'preferences', 'notifications', 'organisation', 'team', 'usage', 'upgrade-plan'].includes(view)) {
      setCurrentView(view)
    }
  }, [searchParams])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    companyName: tenant?.name || '',
    businessRegistrationNumber: '',
    peppolId: ''
  })

  // Settings navigation items
  const settingsViews: SidebarItem[] = [
    { id: 'account', name: 'Account', icon: User, description: '' },
    { id: 'preferences', name: 'Preferences', icon: Settings, description: '' },
    { id: 'notifications', name: 'Notifications', icon: Bell, description: '' },
    { id: 'organisation', name: 'Organisation', icon: Building2, description: '' },
    { id: 'team', name: 'Team', icon: Users, description: '' },
    { id: 'usage', name: 'Usage', icon: BarChart3, description: '' },
    { id: 'upgrade-plan', name: 'Upgrade Plan', icon: Crown, description: '' },
  ]

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving settings:', formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      companyName: tenant?.name || '',
      businessRegistrationNumber: '',
      peppolId: ''
    })
    setIsEditing(false)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'account':
        return (
          <div className="space-y-4 p-4">
            {/* Account Section */}
            <div>
              <h2 className="text-sm font-semibold mb-6">Account</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="preferredName" className="text-sm font-medium text-sm text-gray-600">Preferred name</Label>
                    <Input
                      id="preferredName"
                      value={`${formData.firstName} ${formData.lastName}`.trim()}
                      onChange={(e) => {
                        const names = e.target.value.split(' ')
                        setFormData(prev => ({ 
                          ...prev, 
                          firstName: names[0] || '', 
                          lastName: names.slice(1).join(' ') || '' 
                        }))
                      }}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                {!isEditing && (
                  <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => setIsEditing(true)}>
                    Edit your preferred name and add an icon
                  </Button>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            )}

            <Separator />

            {/* Account Security Section */}
            <div>
              <h2 className="text-sm font-semibold mb-6">Account security</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-sm text-gray-600">{formData.email}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change email
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Password</p>
                    <p className="text-sm text-gray-600">Set a permanent password to login to your account.</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Add password
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">2-step verification</p>
                    <p className="text-sm text-gray-600">Add an additional layer of security to your account during login.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Add verification method
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Passkeys</p>
                    <p className="text-sm text-gray-600">Securely sign-in with on-device biometric authentication.</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Add passkey
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Support Section */}
            <div>
              <h2 className="text-sm font-semibold mb-6">Support</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Support access</p>
                    <p className="text-sm text-gray-600">Grant temporary access to PeppolSheet support.</p>
                  </div>
                  <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'preferences':
        return (
          <div className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold mb-6">Preferences</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Language</p>
                    <p className="text-sm text-gray-600">Choose your preferred language</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">English</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Theme</p>
                    <p className="text-sm text-gray-600">Choose your preferred theme</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">System</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Date format</p>
                    <p className="text-sm text-gray-600">Choose your preferred date format</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">MM/DD/YYYY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'notifications':
        return (
          <div className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold mb-6">Notifications</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Email notifications</p>
                    <p className="text-sm text-gray-600">Receive email updates about your invoices</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Push notifications</p>
                    <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                  </div>
                  <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Invoice reminders</p>
                    <p className="text-sm text-gray-600">Get reminded about upcoming invoice due dates</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'organisation':
        return (
          <div className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold mb-6">Organisation</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Company name</p>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Business registration number</p>
                    <Input
                      value={formData.businessRegistrationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessRegistrationNumber: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">PEPPOL ID</p>
                    <Input
                      value={formData.peppolId}
                      onChange={(e) => setFormData(prev => ({ ...prev, peppolId: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit organisation details
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      
      case 'team':
        return (
          <div className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold mb-6">Team</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Team members</p>
                    <p className="text-sm text-gray-600">Manage team members and their permissions</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Invite member
                  </Button>
                </div>
                
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Team management features coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'usage':
        return (
          <div className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold mb-6">Usage</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Current usage</p>
                    <p className="text-sm text-gray-600">View your usage statistics and limits</p>
                  </div>
                </div>
                
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Usage statistics coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'upgrade-plan':
        return (
          <div className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold mb-6">Upgrade Plan</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Current plan</p>
                    <p className="text-sm text-gray-600">Enterprise Plan</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                
                <div className="text-center py-12">
                  <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Subscription management coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <PageSidebar
        title="Settings"
        items={settingsViews}
        activeItem={currentView}
        onItemClick={(itemId) => setCurrentView(itemId as SettingsViewType)}
      >
        {renderCurrentView()}
      </PageSidebar>
    </div>
  )
}
