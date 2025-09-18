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
  PenLine,
  Plus,
  Receipt,
  Search,
  Upload,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { RoleNavMain } from "@/components/role-nav-main"
import { NavDocuments } from "@/components/nav-documents"
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
      url: "/dashboard/overview",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Document",
      url: "/dashboard/add-new",
      icon: Plus,
      isActive: false,
      items: [],
    },
    {
      title: "Upload",
      url: "/dashboard/upload",
      icon: Upload,
      isActive: false,
      items: [],
    },
  ],
  documentItems: [
    {
      name: "Invoices",
      url: "/dashboard/overview",
      icon: FileText,
      items: [
        {
          title: "Invoice #INV-2024-001",
          url: "/dashboard/e-invoice/INV-2024-001",
        },
        {
          title: "Invoice #INV-2024-002", 
          url: "/dashboard/e-invoice/INV-2024-002",
        },
        {
          title: "Invoice #INV-2024-003",
          url: "/dashboard/e-invoice/INV-2024-003",
        },
      ],
    },
    {
      name: "Credit Notes",
      url: "/dashboard/overview",
      icon: PenLine,
      items: [
        {
          title: "Credit Note #CN-2024-001",
          url: "/dashboard/e-invoice/CN-2024-001",
        },
        {
          title: "Credit Note #CN-2024-002",
          url: "/dashboard/e-invoice/CN-2024-002",
        },
      ],
    },
    {
      name: "Organization",
      url: "/dashboard/e-invoice/organization",
      icon: Building2,
      items: [
        {
          title: "Search",
          url: "/dashboard/e-invoice/organization/search",
        },
        {
          title: "Directory",
          url: "/dashboard/e-invoice/organization/directory",
        },
      ],
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
        <NavDocuments documentItems={data.documentItems} />
        <RoleNavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
