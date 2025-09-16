# E-Invoice Components

This directory contains the Document Card Design components for the e-invoice management interface, based on the UI/UX specification.

## Components

### DocumentCard
A reusable card component for displaying individual invoice documents with all necessary actions and status indicators.

**Features:**
- ✅ Selection checkbox for bulk operations
- ✅ Status badges with color coding
- ✅ Contextual action buttons (Edit, View, Send)
- ✅ Dropdown menu with additional actions
- ✅ PEPPOL verification indicators
- ✅ Responsive design
- ✅ Accessibility support

**Props:**
```typescript
interface DocumentCardProps {
  document: Document
  isSelected?: boolean
  onSelect?: (documentId: string, selected: boolean) => void
  onEdit?: (document: Document) => void
  onView?: (document: Document) => void
  onSend?: (document: Document) => void
  onDuplicate?: (document: Document) => void
  onDelete?: (document: Document) => void
  onDownloadUBL?: (document: Document) => void
  onViewUBL?: (document: Document) => void
  className?: string
}
```

### DocumentGrid
A comprehensive grid component that manages multiple document cards with filtering, searching, and bulk operations.

**Features:**
- ✅ Grid and list view modes
- ✅ Search functionality
- ✅ Status filtering
- ✅ Bulk selection and operations
- ✅ Loading states with skeletons
- ✅ Empty states
- ✅ Responsive design

**Props:**
```typescript
interface DocumentGridProps {
  documents: Document[]
  onEdit?: (document: Document) => void
  onView?: (document: Document) => void
  onSend?: (document: Document) => void
  onDuplicate?: (document: Document) => void
  onDelete?: (document: Document) => void
  onDownloadUBL?: (document: Document) => void
  onViewUBL?: (document: Document) => void
  onBulkSend?: (documents: Document[]) => void
  onBulkExport?: (documents: Document[]) => void
  onBulkDelete?: (documents: Document[]) => void
  loading?: boolean
  className?: string
}
```

## Document Interface

```typescript
interface Document {
  id: string
  documentId: string
  customerName: string
  issueDate: string
  amount: number
  currency: string
  status: 'draft' | 'pending' | 'validated' | 'sent' | 'delivered' | 'failed' | 'paid'
  customerEmail?: string
  customerAddress?: string
  peppolId?: string
  peppolVerified?: boolean
  lastModified?: string
  dueDate?: string
  lineItemsCount?: number
}
```

## Status System

The components support a comprehensive status system with visual indicators:

- **🔴 Draft** - Gray background, ready for editing
- **🟡 Pending** - Yellow background, validation in progress  
- **🟢 Validated** - Green background, ready to send
- **🔵 Sent** - Blue background, transmitted via PEPPOL
- **✅ Delivered** - Green background, successfully delivered
- **❌ Failed** - Red background, transmission failed
- **🎯 Paid** - Purple background, payment received

## Usage Examples

### Basic Document Card
```tsx
import { DocumentCard, Document } from '@/components/e-invoice'

const document: Document = {
  id: '1',
  documentId: 'INV-2024-001',
  customerName: 'Acme Corporation',
  issueDate: '2024-01-15',
  amount: 1250.00,
  currency: 'EUR',
  status: 'draft',
  peppolVerified: true
}

<DocumentCard
  document={document}
  onEdit={(doc) => console.log('Edit:', doc)}
  onView={(doc) => console.log('View:', doc)}
  onSend={(doc) => console.log('Send:', doc)}
/>
```

### Document Grid with Full Functionality
```tsx
import { DocumentGrid } from '@/components/e-invoice'

<DocumentGrid
  documents={documents}
  loading={loading}
  onEdit={handleEdit}
  onView={handleView}
  onSend={handleSend}
  onBulkSend={handleBulkSend}
  onBulkExport={handleBulkExport}
  onBulkDelete={handleBulkDelete}
/>
```

## Demo

Visit `/dashboard/e-invoice/demo` to see the components in action with sample data and interactive functionality.

## Design System Integration

The components are built using:
- **shadcn/ui** components for consistency
- **Tailwind CSS** for styling
- **Lucide React** icons
- **Radix UI** primitives for accessibility

## Accessibility Features

- ✅ ARIA labels and descriptions
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Color contrast compliance (WCAG AA)

## Responsive Design

- ✅ Mobile-first approach
- ✅ Touch-friendly interactions (44px minimum touch targets)
- ✅ Adaptive layouts (grid → list on mobile)
- ✅ Optimized for all screen sizes

## Future Enhancements

- [ ] Drag and drop reordering
- [ ] Advanced filtering options
- [ ] Export to various formats
- [ ] Real-time updates via WebSocket
- [ ] Offline support with sync
- [ ] Advanced search with filters
- [ ] Customizable card layouts
- [ ] Keyboard shortcuts
- [ ] Bulk edit functionality
