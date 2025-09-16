/**
 * Entity Flagging Utility
 * Automatically flags business entities for admin review
 */

export interface BusinessEntity {
  name: string
  business_name?: string
  tax_id?: string
  email?: string
  phone?: string
  website?: string
  industry?: string
  company_street_address?: string
  company_city?: string
  company_state?: string
  company_postal_code?: string
  company_country?: string
  peppol_scheme?: string
  currency?: string
}

export interface FlagResult {
  flagged: boolean
  flags: Array<{
    type: 'suspicious' | 'duplicate' | 'missing_data' | 'format_issue'
    description: string
  }>
}

/**
 * Check if email format is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check if phone format is valid (basic check)
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

/**
 * Check if tax ID format is valid (basic check)
 */
function isValidTaxId(taxId: string): boolean {
  // Basic check for common tax ID formats
  const cleanTaxId = taxId.replace(/[\s\-]/g, '')
  return cleanTaxId.length >= 8 && cleanTaxId.length <= 15
}

/**
 * Check if entity name is generic or suspicious
 */
function isGenericName(name: string): boolean {
  const genericNames = [
    'test', 'example', 'demo', 'sample', 'company', 'corp', 'inc', 'llc',
    'abc', 'xyz', 'temp', 'dummy', 'fake', 'placeholder'
  ]
  
  const lowerName = name.toLowerCase()
  return genericNames.some(generic => lowerName.includes(generic))
}

/**
 * Check if email is suspicious
 */
function isSuspiciousEmail(email: string): boolean {
  const suspiciousDomains = [
    'test.com', 'example.com', 'demo.com', 'sample.com',
    'temp.com', 'dummy.com', 'fake.com', 'placeholder.com'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  return suspiciousDomains.includes(domain || '')
}

/**
 * Check if address is suspicious
 */
function isSuspiciousAddress(address: string): boolean {
  const suspiciousPatterns = [
    'test', 'example', 'demo', 'sample', 'fake', 'dummy',
    '123 fake', 'test address', 'example street'
  ]
  
  const lowerAddress = address.toLowerCase()
  return suspiciousPatterns.some(pattern => lowerAddress.includes(pattern))
}

/**
 * Check for missing required data
 */
function checkMissingData(entity: BusinessEntity): Array<{ type: "suspicious" | "duplicate" | "missing_data" | "format_issue"; description: string }> {
  const flags = []
  
  if (!entity.email && !entity.phone) {
    flags.push({
      type: 'missing_data' as const,
      description: 'No contact information provided (email or phone required)'
    })
  }
  
  if (!entity.company_street_address || !entity.company_city) {
    flags.push({
      type: 'missing_data' as const,
      description: 'Incomplete billing address information'
    })
  }
  
  if (!entity.tax_id) {
    flags.push({
      type: 'missing_data' as const,
      description: 'No tax ID provided'
    })
  }
  
  return flags
}

/**
 * Check for format issues
 */
function checkFormatIssues(entity: BusinessEntity): Array<{ type: "suspicious" | "duplicate" | "missing_data" | "format_issue"; description: string }> {
  const flags = []
  
  if (entity.email && !isValidEmail(entity.email)) {
    flags.push({
      type: 'format_issue' as const,
      description: 'Invalid email format'
    })
  }
  
  if (entity.phone && !isValidPhone(entity.phone)) {
    flags.push({
      type: 'format_issue' as const,
      description: 'Invalid phone number format'
    })
  }
  
  if (entity.tax_id && !isValidTaxId(entity.tax_id)) {
    flags.push({
      type: 'format_issue' as const,
      description: 'Invalid tax ID format'
    })
  }
  
  return flags
}

/**
 * Check for suspicious patterns
 */
function checkSuspiciousPatterns(entity: BusinessEntity): Array<{ type: "suspicious" | "duplicate" | "missing_data" | "format_issue"; description: string }> {
  const flags = []
  
  if (entity.name && isGenericName(entity.name)) {
    flags.push({
      type: 'suspicious' as const,
      description: 'Generic or suspicious company name detected'
    })
  }
  
  if (entity.email && isSuspiciousEmail(entity.email)) {
    flags.push({
      type: 'suspicious' as const,
      description: 'Suspicious email domain detected'
    })
  }
  
  if (entity.company_street_address && isSuspiciousAddress(entity.company_street_address)) {
    flags.push({
      type: 'suspicious' as const,
      description: 'Suspicious address pattern detected'
    })
  }
  
  return flags
}

/**
 * Main flagging function
 */
export function flagEntity(entity: BusinessEntity): FlagResult {
  const flags = [
    ...checkMissingData(entity),
    ...checkFormatIssues(entity),
    ...checkSuspiciousPatterns(entity)
  ]
  
  return {
    flagged: flags.length > 0,
    flags
  }
}

/**
 * Get flag priority for sorting
 */
export function getFlagPriority(flagType: string): number {
  switch (flagType) {
    case 'suspicious': return 3
    case 'duplicate': return 2
    case 'missing_data': return 1
    case 'format_issue': return 0
    default: return 0
  }
}

/**
 * Sort flags by priority
 */
export function sortFlagsByPriority(flags: FlagResult['flags']): FlagResult['flags'] {
  return flags.sort((a, b) => getFlagPriority(b.type) - getFlagPriority(a.type))
}

/**
 * Get flag summary for display
 */
export function getFlagSummary(flags: FlagResult['flags']): string {
  if (flags.length === 0) return 'No issues detected'
  
  const flagCounts = flags.reduce((acc, flag) => {
    acc[flag.type] = (acc[flag.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const parts = Object.entries(flagCounts).map(([type, count]) => {
    const typeName = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    return `${count} ${typeName}${count > 1 ? 's' : ''}`
  })
  
  return parts.join(', ')
}
