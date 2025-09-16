"use client"

import { useState, useEffect, useCallback } from 'react'
import { usePeppolDiscovery } from '@/lib/hooks/use-peppol-discovery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Globe, 
  Loader2,
  AlertCircle
} from 'lucide-react'

interface PeppolDiscoveryProps {
  onCompanyDiscovered?: (result: {
    identifier: string
    scheme: string
    canReceiveInvoices: boolean
    deliveryMethod: 'peppol' | 'email'
    isEmailDelivery: boolean
  }) => void
  initialIdentifier?: string
  initialCountry?: string
  disabled?: boolean
}

export function PeppolDiscovery({ 
  onCompanyDiscovered, 
  initialIdentifier = '',
  initialCountry = '',
  disabled = false
}: PeppolDiscoveryProps) {
  const [identifier, setIdentifier] = useState(initialIdentifier)
  const [country, setCountry] = useState(initialCountry)
  const { isLoading, result, error, discoverCompany, clearResult } = usePeppolDiscovery()

  const handleDiscover = useCallback(async () => {
    if (!identifier.trim()) return
    
    try {
      const discoveryResult = await discoverCompany(identifier, country)
      if (discoveryResult && onCompanyDiscovered) {
        onCompanyDiscovered(discoveryResult)
      }
    } catch (error) {
      console.error('Discovery failed:', error)
    }
  }, [identifier, country, discoverCompany, onCompanyDiscovered])

  // Auto-discover when identifier and country are provided
  useEffect(() => {
    if (identifier.trim() && country && !isLoading && !result) {
      handleDiscover()
    }
  }, [identifier, country, handleDiscover, isLoading, result])

  const handleClear = () => {
    clearResult()
    setIdentifier('')
  }

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (result?.canReceiveInvoices) return <CheckCircle className="w-4 h-4 text-green-500" />
    if (result && !result.canReceiveInvoices) return <XCircle className="w-4 h-4 text-yellow-500" />
    return <Search className="w-4 h-4" />
  }

  const getStatusColor = () => {
    if (error) return 'bg-red-50 border-red-200'
    if (result?.canReceiveInvoices) return 'bg-green-50 border-green-200'
    if (result && !result.canReceiveInvoices) return 'bg-yellow-50 border-yellow-200'
    return 'bg-blue-50 border-blue-200'
  }

  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter VAT number or company identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleDiscover()}
            disabled={disabled || isLoading}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleDiscover}
          disabled={disabled || isLoading || !identifier.trim()}
          size="sm"
          className="px-3"
        >
          {getStatusIcon()}
          {isLoading ? 'Searching...' : 'Discover'}
        </Button>
      </div>

      {/* Discovery Results */}
      {(result || error) && (
        <Card className={`${getStatusColor()} transition-all duration-200`}>
          <CardContent className="p-4">
            {error && (
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">Discovery Failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {result.canReceiveInvoices ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-yellow-500" />
                    )}
                                         <div>
                       <p className="font-medium">
                         {result.canReceiveInvoices ? 'PEPPOL Enabled' : 'Not PEPPOL Enabled'}
                       </p>
                       <p className="text-sm text-gray-600">
                         {result.scheme}: {result.identifier}
                       </p>
                       {result.originalIdentifier && result.originalIdentifier !== result.identifier && (
                         <p className="text-xs text-gray-500">
                           (formatted from: {result.originalIdentifier})
                         </p>
                       )}
                     </div>
                  </div>
                  <Button
                    onClick={handleClear}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant={result.canReceiveInvoices ? 'default' : 'secondary'}
                    className="flex items-center space-x-1"
                  >
                    {result.deliveryMethod === 'peppol' ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Mail className="w-3 h-3" />
                    )}
                    <span>
                      {result.deliveryMethod === 'peppol' ? 'PEPPOL Network' : 'Email Delivery'}
                    </span>
                  </Badge>
                  {result.isEmailDelivery && (
                    <Badge variant="outline" className="text-xs">
                      Email Fallback
                    </Badge>
                  )}
                </div>

                <div className="bg-white/50 p-3 rounded-md border">
                  <p className="text-sm font-medium text-gray-800">
                    {result.message}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {result.recommendation}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 