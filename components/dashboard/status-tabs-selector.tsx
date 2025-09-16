"use client"

import React from 'react'
import { X, GripVertical } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface StatusTab {
  id: string
  name: string
  count: number
  icon: LucideIcon
  isActive: boolean
}

interface StatusTabsSelectorProps {
  isOpen: boolean
  onClose: () => void
  allTabs: StatusTab[]
  visibleTabs: string[]
  onToggleTab: (tabId: string) => void
  onReorderTabs: (newOrder: string[]) => void
  title?: string
  itemType?: string
}

// Sortable Item Component
function SortableTabItem({ 
  tab, 
  isVisible, 
  canToggle, 
  onToggleTab, 
  itemType 
}: { 
  tab: StatusTab
  isVisible: boolean
  canToggle: boolean
  onToggleTab: (tabId: string) => void
  itemType: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const IconComponent = tab.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isVisible 
          ? 'border-blue-200 bg-blue-50' 
          : 'border-gray-200 hover:bg-gray-50'
      } ${
        !canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      
      <input
        type="checkbox"
        checked={isVisible}
        onChange={() => canToggle && onToggleTab(tab.id)}
        disabled={!canToggle}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <IconComponent className="w-5 h-5 text-gray-500" />
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900">{tab.name}</span>
        <div className="text-xs text-gray-500">{tab.count} {itemType}</div>
      </div>
    </div>
  )
}

export function StatusTabsSelector({ 
  isOpen, 
  onClose, 
  allTabs, 
  visibleTabs, 
  onToggleTab,
  onReorderTabs,
  title = "Customize Status Tabs",
  itemType = "documents"
}: StatusTabsSelectorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = allTabs.findIndex(tab => tab.id === active.id)
      const newIndex = allTabs.findIndex(tab => tab.id === over.id)
      
      const reorderedTabs = arrayMove(allTabs, oldIndex, newIndex)
      const newOrder = reorderedTabs.map(tab => tab.id)
      onReorderTabs(newOrder)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">Select which tabs to display (minimum 4)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={allTabs.map(tab => tab.id)}
                strategy={verticalListSortingStrategy}
              >
                {allTabs.map((tab) => {
                  const isVisible = visibleTabs.includes(tab.id)
                  const canToggle = isVisible ? visibleTabs.length > 4 : true
                  
                  return (
                    <SortableTabItem
                      key={tab.id}
                      tab={tab}
                      isVisible={isVisible}
                      canToggle={canToggle}
                      onToggleTab={onToggleTab}
                      itemType={itemType}
                    />
                  )
                })}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-500">
            {visibleTabs.length} of {allTabs.length} tabs selected
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
