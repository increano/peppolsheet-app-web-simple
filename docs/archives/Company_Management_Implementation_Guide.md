# Company Management Interface Implementation Guide

## Overview
Transform a basic company search interface into a sophisticated multi-step, multi-select system with tabbed navigation and data table management while preserving the original clean styling.

## Initial State Analysis
The original interface contained:
- Top navigation breadcrumb (Dashboard > E-invoice > Companies)
- Action buttons (Home, New Company, Bulk Import)
- Simple "Add New Company" section with basic search
- "Alternative Options" section with manual add button
- Clean, minimal styling with subtle borders and spacing

## Implementation Steps

### Step 1: Add Step-Based Sidebar Navigation
**Objective**: Replace simple form with guided multi-step process

**Implementation**:
- Create sidebar with 5 steps: Company Details, Contact Information, Business Details, Billing Preferences, Review & Save
- Use icons and step indicators for visual hierarchy
- Maintain existing card-based layout structure
- Preserve original spacing and typography

**Key Components**:
\`\`\`tsx
// Step navigation with icons and progress indicators
const steps = [
  { id: 1, name: "Company Details", icon: Building2, description: "Basic company information" },
  { id: 2, name: "Contact Information", icon: MapPin, description: "Address and contact details" },
  // ... additional steps
]
\`\`\`

### Step 2: Implement Auto-Complete Search
**Objective**: Replace basic search with intelligent company lookup

**Implementation**:
- Add real-time search suggestions with company logos
- Include company domain, industry, and location in results
- Implement "Not found? Add manually" fallback option
- Maintain original search input styling

**Key Features**:
- Debounced search (300ms delay)
- Rich result display with company metadata
- Smooth dropdown animations
- Keyboard navigation support

### Step 3: Add Multi-Select Functionality
**Objective**: Enable bulk company selection and management

**Implementation**:
- Add toggle between single/multi-select modes
- Include checkboxes on search results
- Create selected companies management panel
- Implement bulk actions (Add All, Clear All)

**State Management**:
\`\`\`tsx
const [isMultiSelect, setIsMultiSelect] = useState(false)
const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([])
\`\`\`

### Step 4: Create Tabbed Navigation
**Objective**: Separate search functionality from manual entry

**Implementation**:
- Add tab navigation above main content
- Create "Search Companies" and "Add Manually" tabs
- Maintain consistent styling across tab content
- Preserve original section spacing

**Tab Structure**:
- Tab 1: Search Companies (auto-complete + multi-select)
- Tab 2: Add Manually (step-based form process)

### Step 5: Implement Data Table for Selected Companies
**Objective**: Replace simple list with professional data table

**Implementation**:
- Create table matching reference design aesthetic
- Include columns: Name (with logo), Location, E-invoice Enabled, Tax ID, Actions
- Add alternating row colors and hover states
- Implement individual remove actions

**Table Specifications**:
- Clean borders and consistent spacing
- Status badges for E-invoice Enabled column
- Monospace font for Tax ID display
- Remove buttons with hover effects

## Styling Preservation Guidelines

### Color Scheme
- Maintain original neutral palette (grays, whites)
- Use subtle blue accents for interactive elements
- Preserve existing border colors and opacity

### Typography
- Keep original font weights and sizes
- Maintain consistent line heights
- Preserve heading hierarchy

### Layout
- Maintain original card-based structure
- Preserve existing padding and margins
- Keep consistent gap spacing between elements

### Interactive Elements
- Use existing button styles as base
- Maintain hover state consistency
- Preserve focus indicators

## Component Architecture

### Main Container
\`\`\`tsx
// Preserve original layout structure
<div className="min-h-screen bg-gray-50">
  <TopNavigation />
  <MainContent>
    <TabNavigation />
    <ContentArea />
  </MainContent>
</div>
\`\`\`

### State Management Pattern
- Use React useState for local component state
- Implement controlled components for form inputs
- Manage search and selection state at parent level

### Data Flow
1. User searches → Auto-complete suggestions appear
2. User selects companies → Added to selected list
3. Selected companies → Displayed in data table
4. Bulk actions → Process multiple companies simultaneously

## Key Implementation Notes

- **Preserve existing CSS classes** and only add new ones
- **Maintain component hierarchy** from original design
- **Use existing spacing utilities** (gap-4, space-y-6, etc.)
- **Keep original responsive behavior** intact
- **Implement progressive enhancement** - each step builds on previous functionality

## Testing Considerations

- Verify search functionality works with various input lengths
- Test multi-select state management across tab switches
- Ensure data table renders correctly with different data sets
- Validate step navigation maintains form state
- Check responsive behavior on mobile devices