"use client"

import { ChevronRight, FileText, type LucideIcon } from "lucide-react"
import React, { useState } from "react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavDocuments({
  documentItems,
}: {
  documentItems: {
    name: string
    url: string
    icon: LucideIcon
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        newSet.delete(itemName)
      } else {
        newSet.add(itemName)
      }
      return newSet
    })
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>E-Invoice</SidebarGroupLabel>
      <SidebarMenu>
        {documentItems.map((item) => {
          const hasSubItems = item.items && item.items.length > 0
          const isExpanded = expandedItems.has(item.name)
          
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild={!hasSubItems}
                tooltip={hasSubItems ? undefined : item.name}
                onClick={hasSubItems ? () => toggleExpanded(item.name) : undefined}
              >
                {hasSubItems ? (
                  <>
                    {item.icon && <item.icon />}
                    <span>{item.name}</span>
                    <ChevronRight 
                      className={`ml-auto h-4 w-4 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`} 
                    />
                  </>
                ) : (
                  <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.name}</span>
                  </a>
                )}
              </SidebarMenuButton>
              {hasSubItems && isExpanded && (
                <SidebarMenuSub>
                  {item.items!.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={subItem.url}>
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
