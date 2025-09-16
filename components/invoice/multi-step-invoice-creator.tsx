"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { BusinessEntityStep } from './steps/business-entity-step'
import { InvoiceDetailsStep } from './steps/invoice-details-step'

interface BusinessEntity {
  id?: string
  type: 'individual' | 'belgianCompany' | 'euCompany' | 'nonEuCompany' | 'dontKnow'
  companyName: string
  email: string
  phone?: string
  street?: string
  number?: string
  box?: string
  postalCode?: string
  city?: string
  country?: string
  notes?: string
  vatNumber?: string
}

interface InvoiceDetails {
  invoiceDate: string
  expirationDate?: string
  reference: string
  isCreditNote: boolean
  category: string
  customCategory?: string
}

interface InvoiceData {
  businessEntity?: BusinessEntity
  invoiceDetails?: InvoiceDetails
  lineItems?: any[]
  review?: any
}

const STEPS = [
  { key: 'businessEntity', titleKey: 'multiStep.step1' },
  { key: 'invoiceDetails', titleKey: 'multiStep.step2' },
  { key: 'lineItems', titleKey: 'multiStep.step3' },
  { key: 'review', titleKey: 'multiStep.step4' }
]

interface MultiStepInvoiceCreatorProps {
  onClose?: () => void
  onComplete?: (data: InvoiceData) => void
}

export function MultiStepInvoiceCreator({ onClose, onComplete }: MultiStepInvoiceCreatorProps) {
  const t = useTranslations('invoice')
  const [currentStep, setCurrentStep] = useState(0)
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({})

  const currentStepKey = STEPS[currentStep].key
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete(invoiceData)
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on completed steps or the next step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex)
    }
  }

  const updateInvoiceData = (stepKey: string, data: any) => {
    setInvoiceData(prev => ({
      ...prev,
      [stepKey]: data
    }))
  }

  const isStepCompleted = (stepIndex: number) => {
    const stepKey = STEPS[stepIndex].key
    return !!invoiceData[stepKey as keyof InvoiceData]
  }

  const canProceed = () => {
    switch (currentStepKey) {
      case 'businessEntity':
        return !!invoiceData.businessEntity && 
               !!invoiceData.businessEntity.companyName && 
               !!invoiceData.businessEntity.country && 
               !!invoiceData.businessEntity.vatNumber
      case 'invoiceDetails':
        return !!invoiceData.invoiceDetails && 
               !!invoiceData.invoiceDetails.invoiceDate &&
               !!invoiceData.invoiceDetails.reference &&
               !!invoiceData.invoiceDetails.category
      case 'lineItems':
        return !!invoiceData.lineItems && invoiceData.lineItems.length > 0
      case 'review':
        return true
      default:
        return false
    }
  }

  const renderCurrentStep = () => {
    switch (currentStepKey) {
      case 'businessEntity':
        return (
          <BusinessEntityStep
            data={invoiceData.businessEntity}
            onUpdate={(data) => updateInvoiceData('businessEntity', data)}
          />
        )
      case 'invoiceDetails':
        return (
          <InvoiceDetailsStep
            data={invoiceData.invoiceDetails}
            onUpdate={(data) => updateInvoiceData('invoiceDetails', data)}
          />
        )
      case 'lineItems':
        return (
          <div className="p-6 text-center text-gray-500">
            Line Items Step - Coming Soon
          </div>
        )
      case 'review':
        return (
          <div className="p-6 text-center text-gray-500">
            Review & Submit Step - Coming Soon
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('createInvoice')}</span>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </CardTitle>
          
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => handleStepClick(index)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    index === currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : isStepCompleted(index)
                      ? 'border-green-600 bg-green-600 text-white'
                      : index < currentStep
                      ? 'border-gray-400 bg-gray-400 text-white cursor-pointer hover:bg-gray-500'
                      : 'border-gray-300 bg-gray-100 text-gray-400'
                  }`}
                  disabled={index > currentStep}
                >
                  {isStepCompleted(index) && index !== currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                
                <div className="ml-3 flex-1">
                  <div className={`text-sm font-medium ${
                    index === currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {t(step.titleKey)}
                  </div>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="min-h-[600px]">
          {renderCurrentStep()}
        </CardContent>
        
        {/* Navigation Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('entityForm.cancel')}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {currentStep + 1} / {STEPS.length}
            </Badge>
          </div>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center"
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Submit Invoice
              </>
            ) : (
              <>
                {t('entityForm.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
} 