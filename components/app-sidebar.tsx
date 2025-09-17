"use client"

import * as React from "react"
import {
  AudioWaveform,
  BarChart3,
  Command,
  FileText,
  GalleryVerticalEnd,
  LayoutDashboard,
  PenLine,
  Plus,
  Receipt,
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
      url: "/dashboard/e-invoice/overview",
      icon: LayoutDashboard,
      isActive: true,
      items: [],
    },
    {
      title: "Add New",
      url: "/dashboard/e-invoice/add-new",
      icon: Plus,
      isActive: false,
      items: [],
    },
    {
      title: "Upload",
      url: "/dashboard/e-invoice/upload",
      icon: Upload,
      isActive: false,
      items: [],
    },
  ],
  documentItems: [
    {
      name: "Invoices",
      url: "/dashboard/e-invoice/overview",
      icon: FileText,
      items: [
        {
          title: "Invoice #INV-2024-001",
          url: "/dashboard/e-invoice/documents/INV-2024-001",
        },
        {
          title: "Invoice #INV-2024-002", 
          url: "/dashboard/e-invoice/documents/INV-2024-002",
        },
        {
          title: "Invoice #INV-2024-003",
          url: "/dashboard/e-invoice/documents/INV-2024-003",
        },
      ],
    },
    {
      name: "Credit Notes",
      url: "/dashboard/e-invoice/overview",
      icon: PenLine,
      items: [
        {
          title: "Credit Note #CN-2024-001",
          url: "/dashboard/e-invoice/documents/CN-2024-001",
        },
        {
          title: "Credit Note #CN-2024-002",
          url: "/dashboard/e-invoice/documents/CN-2024-002",
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
