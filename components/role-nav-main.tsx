"use client"

import { type LucideIcon, Shield, Users } from "lucide-react"
import { useRoleAuth } from '@/lib/role-auth-context'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function RoleNavMain() {
  const { roleUser, hasRole } = useRoleAuth()
  const params = useParams()
  const locale = params.locale as string || 'en'

  // Define navigation items for each role
  const roleNavItems = {
    admin: [
      {
        title: "Admin",
        url: `/${locale}/dashboard/admin`,
        icon: Shield,
      },
      {
        title: "Support",
        url: `/${locale}/dashboard/support`,
        icon: Users,
      },
    ],
    support: [
      {
        title: "Support",
        url: `/${locale}/dashboard/support`,
        icon: Users,
      },
    ],
  }

  // Get navigation items based on user role
  const getNavItems = () => {
    if (!roleUser) return []
    
    // Admin users see all role dashboards
    if (roleUser.role === 'admin') {
      return roleNavItems.admin
    }
    
    // Other users see only their specific dashboard
    return roleNavItems[roleUser.role] || []
  }

  const navItems = getNavItems()

  if (navItems.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin & Support</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link href={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
