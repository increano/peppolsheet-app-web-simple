# E-Invoice Management UI/UX Specification
## Dashboard Page: `/dashboard/e-invoice/manage`

### Overview
This specification outlines the UI/UX design for a comprehensive e-invoice management interface that allows users to create, edit, view, transform to UBL XML, preview UBL, and send invoices via StoreCove API. The design follows modern SaaS principles with a focus on usability, visual hierarchy, and efficient workflows.

### Design System Foundation
Based on the current PeppolSheet design system:
- **Component Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables
- **Color Palette**: Neutral grays with semantic colors (blue for primary actions, green for success, red for errors)
- **Typography**: Clean, readable fonts with proper hierarchy
- **Layout**: Card-based design with proper spacing and visual separation

---

## 2. Main Content Area

### 2.1 Invoice Grid View (Default)
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Invoice Card │ Invoice Card │ Invoice Card │ Invoice Card │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Invoice Card │ Invoice Card │ Invoice Card │ Invoice Card │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 2.1.1 Document Card Design
```
┌─────────────────────────────────────────────────────────┐
│ ☑️ INV-2024-001                           [⋮] │
│ ─────────────────────────────────────────────── │
│ 💼 Acme Corporation                             │
│ 📅 Jan 15, 2024 • 💰 €1,250.00                 │
│ ─────────────────────────────────────────────── │
│ 🟢 Draft        [📝 Edit] [👁️ View] [📤 Send]   │
└─────────────────────────────────────────────────────────┘
```

**Card Components:**
- **Selection Checkbox**: Top-left for bulk operations
- **Invoice ID**: Prominent identifier (clickable link)
- **Status Badge**: Color-coded status indicator
- **Customer Name**: With business icon
- **Date & Amount**: Key information display
- **Action Buttons**: Edit, View, Send (contextual based on status)
- **Dropdown Menu**: Additional actions (Delete, Duplicate, Download UBL, etc.)

### 2.2 Invoice List View (Alternative)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ☑️ │ Invoice ID │ Customer     │ Date      │ Amount   │ Status │ Actions    │
├────┼────────────┼──────────────┼───────────┼──────────┼────────┼────────────┤
│ ☑️ │ INV-2024-001│ Acme Corp   │ Jan 15    │ €1,250   │ 🟢Draft│ [Edit][View] │
│ ☑️ │ INV-2024-002│ Beta Ltd    │ Jan 16    │ €890     │ 🟡Sent │ [View][Copy] │
└────┴────────────┴──────────────┴───────────┴──────────┴────────┴────────────┘
```

**Table Components:**
- **DataTable**: Using existing DataTable component from dashboard
- **Sortable Columns**: Click to sort by any column
- **Responsive Design**: Collapses to card view on mobile
- **Row Actions**: Contextual action buttons per row

---

## 3. Status System & Visual Indicators

### 3.1 Status Badges
```
🔴 Draft      - Gray background, ready for editing
🟡 Pending    - Yellow background, validation in progress
🟢 Validated  - Green background, ready to send
🔵 Sent       - Blue background, transmitted via PEPPOL
✅ Delivered  - Green background, successfully delivered
❌ Failed     - Red background, transmission failed
🎯 Paid       - Purple background, payment received
```

### 3.2 Progress Indicators
```
Draft → Validate → Send → Deliver → Pay
  ●──────○──────○──────○──────○     [Current: Draft]
```

**Components:**
- **Progress Bar**: Visual representation of invoice lifecycle
- **Step Indicators**: Clear steps with completion status
- **Current Stage Highlight**: Emphasized current position

---

## 4. Modal Dialogs & Overlays

### 4.1 Invoice Creation/Edit Modal
```
┌─────────────────────────────────────────────────────────────┐
│ ✕ Create New Invoice                                        │
│ ─────────────────────────────────────────────────────────── │
│ ┌─ Invoice Details ─┐ ┌─ Customer Info ─┐ ┌─ Line Items ─┐ │
│ │○ Invoice Details  │ │  Customer Info   │ │  Line Items  │ │
│ │  ○ Customer Info  │ │                  │ │              │ │
│ │  ○ Line Items     │ │                  │ │              │ │
│ │  ○ Review & Send  │ │                  │ │              │ │
│ └───────────────────┘ └──────────────────┘ └──────────────┘ │
│ ─────────────────────────────────────────────────────────── │
│                           [Cancel] [Save Draft] [Continue] │
└─────────────────────────────────────────────────────────────┘
```

**Modal Features:**
- **Large Modal**: 90% viewport width, max-width for desktop
- **Multi-step Form**: Progress indicator with step navigation
- **Responsive Design**: Adapts to mobile screens
- **Auto-save**: Draft saves automatically every 30 seconds
- **Validation**: Real-time validation with error states

### 4.2 UBL Preview Modal
```
┌─────────────────────────────────────────────────────────────┐
│ ✕ UBL XML Preview - INV-2024-001                           │
│ ─────────────────────────────────────────────────────────── │
│ ┌─ JSON Data ─────┐ ┌─ UBL XML ─────────────────────────┐   │
│ │ {               │ │ <?xml version="1.0"?>            │   │
│ │   "ID": "INV-   │ │ <Invoice xmlns="urn:oasis:...">  │   │
│ │   "issueDate":  │ │   <cbc:ID>INV-2024-001</cbc:ID>  │   │
│ │   "customer": { │ │   <cbc:IssueDate>2024-01-15     │   │
│ │     "name": "..." │ │   ...                          │   │
│ │   }             │ │ </Invoice>                       │   │
│ │ }               │ │                                  │   │
│ └─────────────────┘ └──────────────────────────────────┘   │
│ ─────────────────────────────────────────────────────────── │
│ 🔄 Transform to UBL    📋 Copy XML    💾 Download XML      │
│                      [Close] [Send via StoreCove]         │
└─────────────────────────────────────────────────────────────┘
```

**Preview Features:**
- **Split View**: JSON input on left, UBL XML output on right
- **Syntax Highlighting**: Color-coded JSON and XML
- **Live Transformation**: Real-time conversion as user edits JSON
- **Validation Indicators**: Error/warning badges with line numbers
- **Export Options**: Copy to clipboard, download file
- **Direct Send**: Send UBL directly to StoreCove from preview

### 4.3 Send Confirmation Modal
```
┌─────────────────────────────────────────────────────────────┐
│ ✕ Send Invoice - INV-2024-001                              │
│ ─────────────────────────────────────────────────────────── │
│ 📤 Ready to send invoice to Acme Corporation               │
│                                                             │
│ ┌─ Recipient Details ─────────────────────────────────────┐ │
│ │ 🏢 Acme Corporation                                     │ │
│ │ 🆔 PEPPOL ID: BE:VAT:BE0123456789                      │ │
│ │ ✅ PEPPOL capability confirmed                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Validation Results ────────────────────────────────────┐ │
│ │ ✅ UBL XML structure valid                              │ │
│ │ ✅ All required fields present                          │ │
│ │ ⚠️  1 warning: Optional field missing                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ─────────────────────────────────────────────────────────── │
│                              [Cancel] [Send Invoice]       │
└─────────────────────────────────────────────────────────────┘
```

**Confirmation Features:**
- **Recipient Verification**: Shows PEPPOL ID and capability status
- **Validation Summary**: Clear pass/fail indicators
- **Warning Display**: Non-blocking warnings with explanations
- **Send Button**: Prominent primary action button

---

## 5. Form Components & Input Fields

### 5.1 Invoice Form Layout
```
┌─ Invoice Details ──────────────────────────────────────────┐
│ Invoice Number: [INV-2024-001    ] Auto-generated ✓       │
│ Issue Date:     [📅 Jan 15, 2024 ] Today         ✓       │
│ Due Date:       [📅 Feb 14, 2024 ] 30 days       ✓       │
│ Currency:       [EUR ▼           ] Default       ✓       │
│ ─────────────────────────────────────────────────────────── │
│ Reference:      [PO-2024-567     ] Optional               │
│ Notes:          [Additional invoice notes...            ] │
│                 [                                       ] │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Customer Selection Component
```
┌─ Customer Information ─────────────────────────────────────┐
│ Customer: [🔍 Search or select customer...          ▼]    │
│                                                            │
│ ┌─ Selected: Acme Corporation ─────────────────────────┐   │
│ │ 📧 contact@acme.com                                  │   │
│ │ 📍 123 Business St, Brussels, Belgium              │   │
│ │ 🆔 PEPPOL: BE:VAT:BE0123456789 ✅ Verified          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                             [Edit Details] │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Line Items Table
```
┌─ Invoice Items ──────────────────────────────────────────────────────────┐
│ ┌─────────────┬──────┬─────────┬─────────┬──────────┬─────────────────┐  │
│ │ Description │ Qty  │ Unit    │ Price   │ Tax Rate │ Total          │  │ │
│ ├─────────────┼──────┼─────────┼─────────┼──────────┼─────────────────┤  │
│ │ Web Dev     │ [10] │ [Hours] │ [€100]  │ [21% ▼] │ €1,000.00      │🗑│ │
│ │ Hosting     │ [1 ] │ [Month] │ [€50 ]  │ [21% ▼] │ €50.00         │🗑│ │
│ └─────────────┴──────┴─────────┴─────────┴──────────┴─────────────────┘  │
│ [+ Add Line Item]                                                        │
│ ─────────────────────────────────────────────────────────────────────── │
│                                          Subtotal: €1,050.00           │
│                                               Tax: €220.50              │
│                                             Total: €1,270.50            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Inline Editing**: Click to edit cells directly
- **Automatic Calculations**: Real-time total updates
- **Tax Categories**: Dropdown with common tax rates
- **Add/Remove Rows**: Dynamic row management
- **Validation**: Required field indicators and error states

---

## 6. Navigation & Workflow

### 6.1 Tab Navigation
```
┌─────────────────────────────────────────────────────────────┐
│ [📄 All Invoices] [✏️ Drafts] [📤 Sent] [💰 Paid] [❌ Failed] │
└─────────────────────────────────────────────────────────────┘
```

**Tab Features:**
- **Status-based Filtering**: Pre-filtered views by invoice status
- **Badge Counts**: Number indicators for each status
- **Active State**: Clear visual indication of current tab
- **Responsive**: Scrollable on mobile devices

### 6.2 Action Flow Diagram
```
Create Invoice → Edit Details → Preview UBL → Validate → Send
     ↓              ↓             ↓          ↓        ↓
Save Draft    Auto-save     Transform   Check PEPPOL  StoreCove
              Every 30s      JSON→XML    Capability    API
```

### 6.3 Quick Actions Panel
```
┌─ Quick Actions ─────────────────────────────────────────────┐
│ 📄 [Create Invoice]                                         │
│ 📋 [Duplicate Last]                                         │
│ 📊 [Import from CSV]                                        │
│ 📈 [View Analytics]                                         │
│ ⚙️  [Invoice Settings]                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Data States & Loading

### 7.1 Loading States
```
┌─ Loading Invoices ──────────────────────────────────────────┐
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ ████████████████ │ │ ████████████████ │ │ ████████████████ │ │
│ │ ████████████     │ │ ████████████     │ │ ████████████     │ │
│ │ ████████         │ │ ████████         │ │ ████████         │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Loading Components:**
- **Skeleton Cards**: Animated placeholders mimicking actual content
- **Progressive Loading**: Show partial content as it loads
- **Loading Indicators**: Spinners for actions, progress bars for uploads

### 7.2 Empty States
```
┌─────────────────────────────────────────────────────────────┐
│                         📄                                  │
│                No invoices found                           │
│           Create your first invoice to get started         │
│                                                             │
│                  [+ Create Invoice]                        │
└─────────────────────────────────────────────────────────────┘
```

**Empty State Features:**
- **Friendly Illustration**: Relevant icon or illustration
- **Clear Message**: Helpful explanation of the empty state
- **Primary Action**: Obvious next step for the user
- **Contextual**: Different messages for filtered vs truly empty states

### 7.3 Error States
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Unable to load invoices                                   │
│ There was a problem connecting to the server.              │
│                                                             │
│ [Retry] [Contact Support]                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Mobile Responsiveness

### 8.1 Mobile Layout Adaptations
- **Collapsible Sidebar**: Overlay sidebar navigation
- **Stacked Cards**: Single column card layout
- **Touch-Friendly**: Larger touch targets (44px minimum)
- **Swipe Actions**: Swipe to reveal quick actions
- **Bottom Action Bar**: Primary actions at thumb reach

### 8.2 Mobile-Specific Components
```
┌─────────────────────────────────┐
│ ☰ E-Invoice Manage    [+ New]   │
├─────────────────────────────────┤
│ 🔍 [Search invoices...]         │
│ 🔽 [Filters]                    │
├─────────────────────────────────┤
│ ┌─ INV-2024-001 ──────────────┐ │
│ │ Acme Corporation           │ │
│ │ €1,250.00 • Jan 15, 2024   │ │
│ │ 🟢 Draft    [Edit] [View]   │ │
│ └─────────────────────────────┘ │
│ ┌─ INV-2024-002 ──────────────┐ │
│ │ Beta Ltd                   │ │
│ │ €890.00 • Jan 16, 2024     │ │
│ │ 🟡 Sent     [View] [Copy]   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [📤 Send] [📄 Export] [🗑️ Del] │
└─────────────────────────────────┘
```

---

## 9. Advanced Features

### 9.1 Bulk Operations Interface
```
┌─ Bulk Actions (3 selected) ────────────────────────────────┐
│ Selected Invoices: INV-2024-001, INV-2024-002, +1 more   │
│                                                             │
│ Available Actions:                                          │
│ 📤 [Send All]     - Send all selected invoices            │
│ 📄 [Export CSV]   - Export invoice data                   │
│ 🗑️ [Delete]       - Permanently delete invoices            │
│ 📋 [Duplicate]    - Create copies of selected invoices    │
│                                                             │
│ ⚠️ This action cannot be undone                            │
│                                        [Cancel] [Confirm] │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Real-time Validation Feedback
```
┌─ Validation Status ────────────────────────────────────────┐
│ ✅ Invoice number format valid                              │
│ ✅ Customer PEPPOL ID verified                             │
│ ⚠️ Due date is in the past                                │
│ ❌ Line item description required                          │
│ ✅ Tax calculations correct                                │
│                                                             │
│ 🚫 Cannot send: 1 error found                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Integration Status Panel
```
┌─ StoreCove Integration ────────────────────────────────────┐
│ 🟢 Connection Status: Active                               │
│ 📊 API Usage: 45/1000 calls this month                   │
│ ⏱️ Last Sync: 2 minutes ago                               │
│                                                             │
│ Recent Activity:                                            │
│ • INV-2024-001 sent successfully                          │
│ • INV-2024-002 delivery confirmed                         │
│ • API rate limit warning                                   │
│                                            [View Details] │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Implementation Recommendations

### 10.1 Component Architecture
```
src/components/e-invoice/
├── InvoiceManagementPage.tsx       # Main page component
├── InvoiceGrid.tsx                 # Grid view component
├── InvoiceList.tsx                 # List view component
├── InvoiceCard.tsx                 # Individual invoice card
├── InvoiceFilters.tsx              # Filter/search components
├── modals/
│   ├── InvoiceFormModal.tsx        # Create/edit modal
│   ├── UBLPreviewModal.tsx         # UBL preview modal
│   └── SendConfirmationModal.tsx   # Send confirmation modal
├── forms/
│   ├── InvoiceDetailsForm.tsx      # Invoice info form
│   ├── CustomerSelection.tsx       # Customer picker
│   └── LineItemsTable.tsx          # Items table
└── shared/
    ├── StatusBadge.tsx             # Status indicator
    ├── ValidationIndicator.tsx     # Validation feedback
    └── BulkActionsBar.tsx          # Bulk operations
```

### 10.2 State Management
- **Zustand Store**: Centralized state for invoice data, filters, selections
- **React Query**: API state management with caching and optimistic updates
- **Form State**: React Hook Form for complex form validation
- **Local Storage**: Persist draft data and user preferences

### 10.3 Performance Considerations
- **Virtual Scrolling**: For large invoice lists (react-window)
- **Pagination**: Server-side pagination with infinite scroll option
- **Debounced Search**: Prevent excessive API calls during search
- **Lazy Loading**: Load modals and heavy components on demand
- **Memoization**: Optimize re-renders for complex calculations

### 10.4 Accessibility Features
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Logical focus flow through modals
- **Color Contrast**: WCAG AA compliant color combinations
- **Alternative Text**: Descriptive alt text for icons and images

---

## 11. Technical Integration Points

### 11.1 StoreCove API Integration
- **Authentication**: Secure API key management
- **Error Handling**: Graceful handling of API failures
- **Retry Logic**: Automatic retry for transient failures
- **Webhook Support**: Real-time status updates
- **Rate Limiting**: Respect API rate limits with queuing

### 11.2 UBL Conversion Pipeline
- **JSON Validation**: Client-side validation before conversion
- **Real-time Preview**: Live UBL generation as user types
- **Error Mapping**: Map UBL errors back to form fields
- **Schema Validation**: Validate against UBL 2.1 schema
- **Performance**: Optimize conversion for large invoices

### 11.3 Data Persistence
- **Auto-save**: Continuous draft saving during editing
- **Version History**: Track changes with undo/redo capability
- **Conflict Resolution**: Handle concurrent editing scenarios
- **Backup Strategy**: Regular backups of invoice data
- **Audit Trail**: Log all changes for compliance

---

This specification provides a comprehensive foundation for implementing a modern, user-friendly e-invoice management interface that seamlessly integrates with the existing PeppolSheet design system while providing powerful functionality for UBL conversion and StoreCove integration.
