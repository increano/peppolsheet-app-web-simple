"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTenant } from '@/hooks/use-tenant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const createTenantSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  businessRegistrationNumber: z.string().optional(),
  peppolId: z.string().optional(),
  invoiceVolumePerMonth: z.number().min(0).optional(),
  country: z.string().optional(),
  currency: z.string().default('EUR'),
  taxId: z.string().optional(),
  industry: z.string().optional(),
})

type CreateTenantFormData = z.infer<typeof createTenantSchema>

interface CreateTenantFormProps {
  onSuccess?: () => void
}

export function CreateTenantForm({ onSuccess }: CreateTenantFormProps) {
  const { createTenant } = useTenant()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      companyName: '',
      businessRegistrationNumber: '',
      peppolId: '',
      invoiceVolumePerMonth: 0,
      country: '',
      currency: 'EUR',
      taxId: '',
      industry: ''
    }
  })

  const onSubmit = async (data: CreateTenantFormData) => {
    try {
      setIsSubmitting(true)
      
      // Use the createTenant function for authenticated users
      await createTenant({
        name: data.companyName,
        businessRegistrationNumber: data.businessRegistrationNumber,
        peppolId: data.peppolId
      })

      toast({
        title: "Success",
        description: "Organization created successfully!",
      })

      onSuccess?.()
    } catch (error) {
      console.error('Failed to create organization:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              placeholder="Enter your company name"
              {...form.register('companyName')}
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-red-600">{form.formState.errors.companyName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessRegistrationNumber">Business Registration Number</Label>
              <Input
                id="businessRegistrationNumber"
                placeholder="Optional"
                {...form.register('businessRegistrationNumber')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peppolId">PEPPOL ID</Label>
              <Input
                id="peppolId"
                placeholder="0000:12345678:01"
                {...form.register('peppolId')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select onValueChange={(value) => form.setValue('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BE">🇧🇪 Belgium</SelectItem>
                  <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                  <SelectItem value="FR">🇫🇷 France</SelectItem>
                  <SelectItem value="NL">🇳🇱 Netherlands</SelectItem>
                  <SelectItem value="ES">🇪🇸 Spain</SelectItem>
                  <SelectItem value="IT">🇮🇹 Italy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select onValueChange={(value) => form.setValue('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="EUR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select onValueChange={(value) => form.setValue('industry', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceVolumePerMonth">Monthly Invoice Volume</Label>
            <Select onValueChange={(value) => form.setValue('invoiceVolumePerMonth', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select volume" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 - Just getting started</SelectItem>
                <SelectItem value="10">1-10 invoices</SelectItem>
                <SelectItem value="50">11-50 invoices</SelectItem>
                <SelectItem value="100">51-100 invoices</SelectItem>
                <SelectItem value="500">101-500 invoices</SelectItem>
                <SelectItem value="1000">501-1000 invoices</SelectItem>
                <SelectItem value="5000">1000+ invoices</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Organization...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
    </form>
  )
}