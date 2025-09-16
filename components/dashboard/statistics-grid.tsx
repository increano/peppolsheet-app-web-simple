"use client"

import React, { useState } from 'react'
import { 
  Play, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Eye, 
  ShieldCheck, 
  X, 
  Send, 
  Mail, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Ban, 
  Flag, 
  FileEdit,
  MoreHorizontal,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { StatisticsCustomizationModal } from './statistics-customization-modal'

interface StatCardProps {
  id: string
  title: string
  value: string
  change: number
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  onCustomize: (cardId: string) => void
}

const StatCard: React.FC<StatCardProps> = ({ id, title, value, change, icon: Icon, iconColor, onCustomize }) => {
  const isPositive = change >= 0
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow relative">
      {/* 3-dots menu button */}
      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Card Options</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onCustomize(id)}>
              Customize Statistic
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main content area */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>

      {/* Separator line */}
      <div className="border-t border-gray-200 mb-3"></div>

      {/* Change indicator at bottom */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <ChangeIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {Math.abs(change)}%
          </span>
        </div>
        <p className={`text-xs ${isPositive ? 'text-gray-500' : 'text-gray-500'}`}>
          From The Last Month
        </p>
      </div>
    </div>
  )
}

export function StatisticsGrid() {
  const [selectedStats, setSelectedStats] = useState([
    'in-progress',
    'awaiting-payment', 
    'sent',
    'paid',
    'refused'
  ])
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false)

  const allStats = [
    {
      id: 'in-progress',
      title: 'In Progress',
      value: '145',
      change: 8,
      icon: Play,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'needs-attention',
      title: 'Needs Attention',
      value: '23',
      change: -5,
      icon: AlertTriangle,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'pending-actions',
      title: 'Pending Actions',
      value: '67',
      change: 12,
      icon: Clock,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'closed',
      title: 'Closed',
      value: '234',
      change: 15,
      icon: CheckCircle,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'awaiting-review',
      title: 'Awaiting Review',
      value: '89',
      change: 3,
      icon: Eye,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'validated',
      title: 'Validated',
      value: '156',
      change: 22,
      icon: ShieldCheck,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'not-accepted',
      title: 'Not Accepted',
      value: '12',
      change: -8,
      icon: X,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'sent',
      title: 'Sent',
      value: '321',
      change: 15,
      icon: Send,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'opened',
      title: 'Opened',
      value: '198',
      change: 25,
      icon: Mail,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'outdated',
      title: 'Outdated',
      value: '45',
      change: -12,
      icon: Calendar,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'awaiting-payment',
      title: 'Awaiting Payment',
      value: '267',
      change: 18,
      icon: CreditCard,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'paid',
      title: 'Paid',
      value: '812',
      change: 19,
      icon: DollarSign,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'refused',
      title: 'Refused',
      value: '34',
      change: -15,
      icon: Ban,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'finished',
      title: 'Finished',
      value: '445',
      change: 30,
      icon: Flag,
      iconColor: 'bg-gray-50'
    },
    {
      id: 'proposed-changes',
      title: 'Proposed Changes',
      value: '78',
      change: 7,
      icon: FileEdit,
      iconColor: 'bg-gray-50'
    }
  ]

  const handleCustomize = (cardId: string) => {
    setIsCustomizationModalOpen(true)
  }

  const handleSaveCustomization = (newSelectedStats: string[]) => {
    // Ensure we always have at least 4 statistics
    if (newSelectedStats.length >= 4) {
      setSelectedStats(newSelectedStats)
    }
  }

  // Filter stats based on selected ones
  const displayedStats = allStats.filter(stat => selectedStats.includes(stat.id))

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {displayedStats.map((stat) => (
          <StatCard
            key={stat.id}
            id={stat.id}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            iconColor={stat.iconColor}
            onCustomize={handleCustomize}
          />
        ))}
      </div>

      <StatisticsCustomizationModal
        isOpen={isCustomizationModalOpen}
        onClose={() => setIsCustomizationModalOpen(false)}
        selectedStats={selectedStats}
        onSave={handleSaveCustomization}
      />
    </>
  )
}
