"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, FileText, AlertCircle, Plus } from 'lucide-react'
import React from 'react'

interface InvoiceDetails {
  invoiceDate: string
  expirationDate?: string
  reference: string
  isCreditNote: boolean
  category: string
  customCategory?: string
}

const createInvoiceDetailsSchema = (t: any) => z.object({
  invoiceDate: z.string().min(1, t('invoiceDetails.invoiceDateRequired')),
  expirationDate: z.string().optional(),
  reference: z.string().min(1, t('invoiceDetails.referenceRequired')),
  isCreditNote: z.boolean().default(false),
  category: z.string().min(1, t('invoiceDetails.categoryRequired')),
  customCategory: z.string().optional()
})

interface InvoiceDetailsStepProps {
  data?: InvoiceDetails
  onUpdate: (data: InvoiceDetails) => void
}

// Default service categories
const DEFAULT_CATEGORIES = [
  'consulting',
  'software_development',
  'design',
  'marketing',
  'training',
  'maintenance',
  'support',
  'custom'
]

export function InvoiceDetailsStep({ data, onUpdate }: InvoiceDetailsStepProps) {
  const t = useTranslations('invoice')
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invoiceDetailsSchema = createInvoiceDetailsSchema(t)
  type InvoiceDetailsFormData = z.infer<typeof invoiceDetailsSchema>

  const form = useForm<InvoiceDetailsFormData>({
    resolver: zodResolver(invoiceDetailsSchema),
    defaultValues: {
      invoiceDate: data?.invoiceDate || new Date().toISOString().split('T')[0],
      expirationDate: data?.expirationDate || '',
      reference: data?.reference || '',
      isCreditNote: data?.isCreditNote || false,
      category: data?.category || '',
      customCategory: data?.customCategory || ''
    }
  })

  const handleSubmit = async (formData: InvoiceDetailsFormData) => {
    setError(null)
    
    try {
      const invoiceDetails: InvoiceDetails = {
        invoiceDate: formData.invoiceDate,
        expirationDate: formData.expirationDate,
        reference: formData.reference,
        isCreditNote: formData.isCreditNote,
        category: formData.category === 'custom' ? formData.customCategory || 'custom' : formData.category,
        customCategory: formData.customCategory
      }
      
      onUpdate(invoiceDetails)
    } catch (error) {
      console.error('Invoice details error:', error)
      setError(error instanceof Error ? error.message : 'Failed to save invoice details')
    }
  }

  const handleCategoryChange = (value: string) => {
    form.setValue('category', value)
    setShowCustomCategory(value === 'custom')
    if (value !== 'custom') {
      form.setValue('customCategory', '')
    }
  }

  const generateReference = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const reference = `${year}${month}${day}-${random}`
    form.setValue('reference', reference)
  }

  // Auto-save on form changes
  const watchedValues = form.watch()
  React.useEffect(() => {
    if (Object.keys(form.formState.dirtyFields).length > 0) {
      const isValid = form.formState.isValid
      if (isValid) {
        handleSubmit(watchedValues)
      }
    }
  }, [watchedValues, form.formState.isValid, form.formState.dirtyFields, handleSubmit])

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('invoiceDetails.title')}</CardTitle>
              <p className="text-sm text-blue-600 mt-1">
                {t('invoiceDetails.subtitle')}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Date Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Invoice Date */}
              <div className="space-y-2">
                <Label htmlFor="invoiceDate" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('invoiceDetails.invoiceDate')} *</span>
                </Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  {...form.register('invoiceDate')}
                />
                {form.formState.errors.invoiceDate && (
                  <p className="text-sm text-red-600">{form.formState.errors.invoiceDate.message}</p>
                )}
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <Label htmlFor="expirationDate" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('invoiceDetails.expirationDate')}</span>
                </Label>
                <Input
                  id="expirationDate"
                  type="date"
                  {...form.register('expirationDate')}
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>

            {/* Reference Field */}
            <div className="space-y-2">
              <Label htmlFor="reference">{t('invoiceDetails.reference')} *</Label>
              <div className="flex space-x-2">
                <Input
                  id="reference"
                  {...form.register('reference')}
                  placeholder="85D1945E-0013"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateReference}
                  className="shrink-0"
                >
                  {t('invoiceDetails.generate')}
                </Button>
              </div>
              {form.formState.errors.reference && (
                <p className="text-sm text-red-600">{form.formState.errors.reference.message}</p>
              )}
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <Label htmlFor="category">{t('invoiceDetails.category')} *</Label>
              <Select
                value={form.watch('category')}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('invoiceDetails.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'custom' ? (
                        <div className="flex items-center space-x-2">
                          <Plus className="w-4 h-4" />
                          <span>{t('invoiceDetails.customCategory')}</span>
                        </div>
                      ) : (
                        t(`invoiceDetails.categories.${category}`)
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
              )}
            </div>

            {/* Custom Category Input */}
            {showCustomCategory && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">{t('invoiceDetails.customCategoryName')} *</Label>
                <Input
                  id="customCategory"
                  {...form.register('customCategory')}
                  placeholder={t('invoiceDetails.customCategoryPlaceholder')}
                />
              </div>
            )}

            {/* Credit Note Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                id="isCreditNote"
                type="checkbox"
                checked={form.watch('isCreditNote')}
                onChange={(e) => form.setValue('isCreditNote', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="isCreditNote" className="text-sm">
                {t('invoiceDetails.isCreditNote')}
              </Label>
            </div>

            {/* Accounting Date Option */}
            <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
              <input
                id="accountForToday"
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="accountForToday" className="text-sm text-blue-800">
                {t('invoiceDetails.accountForToday')}
              </Label>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 