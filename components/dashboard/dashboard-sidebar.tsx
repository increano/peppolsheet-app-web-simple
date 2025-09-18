"use client"

import { usePathname } from 'next/navigation'
import { TenantSwitcher } from '@/components/auth/tenant-switcher'
import { UserProfileDropdown } from '@/components/auth/user-profile-dropdown'
import { 
  BarChart3,
  Receipt
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface NavigationItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const navigationItems: NavigationItem[] = [
  {
    href: '/en/dashboard/overview',
    icon: BarChart3,
    label: 'Overview'
  },
  {
    href: '#',
    icon: Receipt,
    label: 'Invoices'
  }
]

export function DashboardSidebar() {
  const pathname = usePathname()

  const isActiveRoute = (href: string) => {
    if (href === '/en/dashboard/overview') {
      return pathname === '/en/dashboard/overview'
    }
    return pathname.startsWith(href) && href !== '#'
  }

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 flex flex-col shadow-lg z-10 hidden md:flex">
      <nav className="flex-1 p-4">
        {/* Brand Logo */}
        <div className="mb-6 flex">
          <Image
            src="/peppolsheet_brandName.svg"
            alt="Peppolsheet"
            width={160}
            height={40}
            className="h-12 w-auto"
          />
        </div>
        
        {/* Tenant Switcher */}
        <div className="mb-4">
          <TenantSwitcher />
        </div>
        
        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Manage General
          </p>
        </div>
        
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile Dropdown at Bottom */}
      <div className="p-4 border-t border-gray-200">
        <UserProfileDropdown />
      </div>
    </aside>
  )
} 