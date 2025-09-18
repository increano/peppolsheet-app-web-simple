"use client"

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateTenantForm } from '@/components/onboarding/create-tenant-form'
import { JoinTenantForm } from '@/components/onboarding/join-tenant-form'
import { LanguageSelector } from "@/components/ui/language-selector"
import { Building, UserPlus, ArrowLeft, Shield } from 'lucide-react'

type OnboardingStep = 'choose' | 'create' | 'join'

export default function TestOnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'

  const handleSuccess = () => {
    router.push(`/${locale}/dashboard/overview`)
  }



  return (
    <ProtectedRoute>
      <div className="h-screen flex">
        {/* Left Column - Cover Image */}
        <div className="hidden md:flex md:w-3/5 lg:w-2/4 relative overflow-hidden">
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-100" 
            style={{backgroundImage: 'url(/images/login-cover.png)'}} 
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/60 via-25% via-black/30 via-40% to-transparent"></div>
          
          {/* Content overlay */}
          <div className="relative z-10 flex flex-col justify-between px-12 text-white py-12">
            <div className="space-y-4">
              {/* Logo placeholder */}
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl font-bold">PeppolSheet</h1>
              </div>
              
              {/* Main heading */}
              <div className="">
                {/*<h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Cashflow Management &
                  <span className="block text-blue-200">PEPPOL-Compliant Solutinon</span>
                </h2>*/}
                <p className="text-xl opacity-90 leading-relaxed">
                  Built for those who rely on simplicity.
                </p>
              </div>
              
            </div>
            
            {/* Testimonial at bottom */}
            <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
              <p className="text-lg italic mb-3">
                "PeppolSheet reduced our invoice processing time by 80% and eliminated manual errors completely."
              </p>
              <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm opacity-75">CFO, TechCorp Europe</p>
                  </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Onboarding Content */}
        <div className="w-full md:w-2/5 lg:w-2/4 flex flex-col justify-center bg-white px-8 py-8">
          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Mobile header (visible only on small screens) */}
            <div className="md:hidden text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">PeppolSheet</h1>
              </div>
            </div>
            
            {/* Language Selector */}
            <div className="flex justify-center">
              <LanguageSelector />
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to PeppolSheet
              </h1>*/}
              <p className="text-gray-600">
                Hi {user?.firstName || 'there'}, let's set up your organization to get started
              </p>
            </div>

            {/* Onboarding Tabs */}
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="create">
                  Create Organization
                </TabsTrigger>
                <TabsTrigger value="join">
                  Join Organization
                </TabsTrigger>
              </TabsList>

              <div className="min-h-[600px] flex flex-col">
                <div className="flex-1">
                  <TabsContent value="create" className="space-y-4 m-0">
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                          Set up a new organization and start managing your invoices
                        </p>
                      </div>
                      <CreateTenantForm onSuccess={handleSuccess} />
                    </div>
                  </TabsContent>

                  <TabsContent value="join" className="space-y-4 m-0">
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                          Request to join an existing organization that uses PeppolSheet
                        </p>
                      </div>
                      <JoinTenantForm onSuccess={handleSuccess} />
                    </div>
                  </TabsContent>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 mt-8">
                  <p>© {new Date().getFullYear()} PeppolSheet. All rights reserved.</p>
                </div>
              </div>
            </Tabs>
          </div>
        </div>


      </div>
    </ProtectedRoute>
  )
}
