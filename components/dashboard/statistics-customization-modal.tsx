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
  X as CloseIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface StatisticOption {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

interface StatisticsCustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  selectedStats: string[]
  onSave: (selectedStats: string[]) => void
}

export function StatisticsCustomizationModal({
  isOpen,
  onClose,
  selectedStats,
  onSave
}: StatisticsCustomizationModalProps) {
  const [tempSelectedStats, setTempSelectedStats] = useState<string[]>(selectedStats)

  const allStatOptions: StatisticOption[] = [
    { id: 'in-progress', title: 'In Progress', icon: Play, iconColor: 'bg-gray-50' },
    { id: 'needs-attention', title: 'Needs Attention', icon: AlertTriangle, iconColor: 'bg-gray-50' },
    { id: 'pending-actions', title: 'Pending Actions', icon: Clock, iconColor: 'bg-gray-50' },
    { id: 'closed', title: 'Closed', icon: CheckCircle, iconColor: 'bg-gray-50' },
    { id: 'awaiting-review', title: 'Awaiting Review', icon: Eye, iconColor: 'bg-gray-50' },
    { id: 'validated', title: 'Validated', icon: ShieldCheck, iconColor: 'bg-gray-50' },
    { id: 'not-accepted', title: 'Not Accepted', icon: X, iconColor: 'bg-gray-50' },
    { id: 'sent', title: 'Sent', icon: Send, iconColor: 'bg-gray-50' },
    { id: 'opened', title: 'Opened', icon: Mail, iconColor: 'bg-gray-50' },
    { id: 'outdated', title: 'Outdated', icon: Calendar, iconColor: 'bg-gray-50' },
    { id: 'awaiting-payment', title: 'Awaiting Payment', icon: CreditCard, iconColor: 'bg-gray-50' },
    { id: 'paid', title: 'Paid', icon: DollarSign, iconColor: 'bg-gray-50' },
    { id: 'refused', title: 'Refused', icon: Ban, iconColor: 'bg-gray-50' },
    { id: 'finished', title: 'Finished', icon: Flag, iconColor: 'bg-gray-50' },
    { id: 'proposed-changes', title: 'Proposed Changes', icon: FileEdit, iconColor: 'bg-gray-50' }
  ]

  const handleToggleStat = (statId: string) => {
    setTempSelectedStats(prev => {
      if (prev.includes(statId)) {
        // Remove if already selected, but prevent going below minimum of 4
        if (prev.length <= 4) {
          return prev
        }
        return prev.filter(id => id !== statId)
      } else {
        // Add if not selected (limit to 5)
        if (prev.length >= 5) {
          return prev
        }
        return [...prev, statId]
      }
    })
  }

  const handleSave = () => {
    onSave(tempSelectedStats)
    onClose()
  }

  const handleReset = () => {
    const defaultStats = ['in-progress', 'awaiting-payment', 'sent', 'paid', 'refused']
    setTempSelectedStats(defaultStats)
  }

  const isAtMinimum = tempSelectedStats.length <= 4
  const isAtMaximum = tempSelectedStats.length >= 5

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Customize Statistics Grid
          </DialogTitle>
          <DialogDescription>
            Select 4-5 statistics to display in your overview dashboard. 
            You must have at least 4 statistics selected.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {allStatOptions.map((option) => {
              const Icon = option.icon
              const isSelected = tempSelectedStats.includes(option.id)
              const isDisabled = !isSelected && isAtMaximum
              const isRequired = isSelected && isAtMinimum

              return (
                <div
                  key={option.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? isRequired 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-blue-50 border-blue-200'
                      : isDisabled 
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => !isDisabled && handleToggleStat(option.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled || isRequired}
                    className="flex-shrink-0"
                  />
                  <div className={`p-2 rounded-lg ${option.iconColor} flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {option.title}
                  </span>
                  {isRequired && (
                    <span className="text-xs text-red-600 ml-auto">
                      Required
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className={`mt-4 p-3 rounded-lg ${
            isAtMinimum 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-sm ${
              isAtMinimum ? 'text-red-700' : 'text-blue-700'
            }`}>
              <strong>Selected:</strong> {tempSelectedStats.length}/5 statistics
              {isAtMinimum && (
                <span className="block mt-1">
                  ⚠️ You must select at least 4 statistics. Some selections are now required.
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={tempSelectedStats.length < 4}
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
