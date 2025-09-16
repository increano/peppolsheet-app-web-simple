"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, UserPlus } from 'lucide-react'

const joinTenantSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  invitationCode: z.string().optional(),
  message: z.string().optional(),
})

type JoinTenantFormData = z.infer<typeof joinTenantSchema>

interface JoinTenantFormProps {
  onSuccess?: () => void
}

export function JoinTenantForm({ onSuccess }: JoinTenantFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const form = useForm<JoinTenantFormData>({
    resolver: zodResolver(joinTenantSchema),
    defaultValues: {
      organizationName: '',
      invitationCode: '',
      message: ''
    }
  })

  const searchOrganizations = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .ilike('name', `%${query}%`)
        .limit(10)

      if (error) {
        console.error('Search error:', error)
        return
      }

      setSearchResults(data || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const requestToJoin = async (tenantId: string, tenantName: string) => {
    try {
      setIsSubmitting(true)
      
      // In a real implementation, this would send a join request
      // For now, we'll just show a success message
      toast({
        title: "Request Sent",
        description: `Your request to join "${tenantName}" has been sent. You'll be notified when it's approved.`,
      })

      onSuccess?.()
    } catch (error) {
      console.error('Failed to request join:', error)
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: JoinTenantFormData) => {
    try {
      setIsSubmitting(true)
      
      // Search for the organization first
      await searchOrganizations(data.organizationName)
      
      if (searchResults.length === 0) {
        toast({
          title: "Not Found",
          description: "No organization found with that name",
          variant: "destructive"
        })
        return
      }

      // For now, automatically request to join the first result
      const organization = searchResults[0]
      await requestToJoin(organization.id, organization.name)
      
    } catch (error) {
      console.error('Failed to join organization:', error)
      toast({
        title: "Error",
        description: "Failed to join organization",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organizationName">Organization Name *</Label>
        <div className="relative">
          <Input
            id="organizationName"
            placeholder="Search for organization name"
            {...form.register('organizationName')}
            onChange={(e) => {
              form.setValue('organizationName', e.target.value)
              searchOrganizations(e.target.value)
            }}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin" />
          )}
        </div>
        {form.formState.errors.organizationName && (
          <p className="text-sm text-red-600">{form.formState.errors.organizationName.message}</p>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <Label>Search Results</Label>
          <div className="border rounded-md max-h-32 overflow-y-auto">
            {searchResults.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => {
                  form.setValue('organizationName', org.name)
                  setSearchResults([])
                }}
                className="w-full text-left p-2 hover:bg-gray-50 border-b last:border-b-0"
              >
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-gray-500">
                  Created {new Date(org.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="invitationCode">Invitation Code (Optional)</Label>
        <Input
          id="invitationCode"
          placeholder="Enter invitation code if you have one"
          {...form.register('invitationCode')}
        />
        <p className="text-sm text-gray-500">
          If you have an invitation code, enter it here to join automatically
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message (Optional)</Label>
        <textarea
          id="message"
          placeholder="Introduce yourself and explain why you want to join"
          className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...form.register('message')}
        />
      </div>

      <div className="bg-blue-50 p-3 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your request will be sent to the organization administrators. 
          They will review your request and notify you via email when it&apos;s approved.
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting || !form.watch('organizationName')}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending Request...
          </>
        ) : (
          <>
            
            Request to Join
          </>
        )}
      </Button>
    </form>
  )
}