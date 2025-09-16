"use client"

import { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OnboardingCardProps {
  step: number
  totalSteps: number
  title: string
  subtitle: string
  children: ReactNode
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  onBackToLogin?: () => void
  nextButtonText?: string
  isNextDisabled?: boolean
  isLoading?: boolean
  showSkip?: boolean
  showBackToLogin?: boolean
}

export function OnboardingCard({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onPrevious,
  onSkip,
  onBackToLogin,
  nextButtonText,
  isNextDisabled = false,
  isLoading = false,
  showSkip = true,
  showBackToLogin = false
}: OnboardingCardProps) {
  const t = useTranslations('onboarding')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress indicator */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i < step
                    ? 'bg-blue-600'
                    : i === step
                    ? 'bg-blue-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {t('step')} {step + 1} {t('of')} {totalSteps}
          </p>
        </div>

        {/* Main card */}
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-base">{subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6">
              <div>
                {step > 0 && onPrevious && (
                  <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('previous')}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {showSkip && onSkip && step < totalSteps - 1 && (
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    disabled={isLoading}
                  >
                    {t('skip')}
                  </Button>
                )}

                {showBackToLogin && onBackToLogin && (
                  <Button
                    variant="ghost"
                    onClick={onBackToLogin}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Back to Login
                  </Button>
                )}

                {onNext && (
                  <Button
                    onClick={onNext}
                    disabled={isNextDisabled || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      "..."
                    ) : (
                      <>
                        {nextButtonText || (step === totalSteps - 1 ? t('finish') : t('next'))}
                        {step < totalSteps - 1 && <ChevronRight className="h-4 w-4" />}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}