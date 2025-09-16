import { useState, useCallback } from 'react'

interface PeppolDiscoveryResult {
  identifier: string
  originalIdentifier?: string
  scheme: string
  canReceiveInvoices: boolean
  isEmailDelivery: boolean
  discoveryCode: string
  message: string
  recommendation: string
  deliveryMethod: 'peppol' | 'email'
}

interface PeppolDiscoveryState {
  isLoading: boolean
  result: PeppolDiscoveryResult | null
  error: string | null
}

export function usePeppolDiscovery() {
  const [state, setState] = useState<PeppolDiscoveryState>({
    isLoading: false,
    result: null,
    error: null
  })

  const discoverCompany = useCallback(async (
    identifier: string,
    country?: string,
    scheme?: string
  ) => {
    if (!identifier.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Identifier is required',
        result: null
      }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/peppol/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          country,
          scheme
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to discover company')
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        result: data.data,
        error: null
      }))

      return data.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        result: null
      }))
      throw error
    }
  }, [])

  const clearResult = useCallback(() => {
    setState({
      isLoading: false,
      result: null,
      error: null
    })
  }, [])

  return {
    ...state,
    discoverCompany,
    clearResult
  }
} 