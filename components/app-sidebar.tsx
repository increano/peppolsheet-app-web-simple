"use client"

import * as React from "react"
import {
  AudioWaveform,
  BarChart3,
  Building2,
  Command,
  FileText,
  GalleryVerticalEnd,
  LayoutDashboard,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { RoleNavMain } from "@/components/role-nav-main"
import { NavAccount } from "@/components/nav-account"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/dashboard/e-invoice/overview",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Manage",
      url: "/dashboard/e-invoice/manage",
      icon: FileText,
      items: [],
    },
    {
      title: "Reports",
      url: "/dashboard/e-invoice/reports",
      icon: BarChart3,
      items: [],
    },
  ],
  accountItems: [
    {
      name: "Companies",
      url: "/dashboard/e-invoice/companies",
      icon: Building2,
    },
    {
      name: "Contacts",
      url: "/dashboard/e-invoice/contacts",
      icon: Users,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAccount accountItems={data.accountItems} />
        <RoleNavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
