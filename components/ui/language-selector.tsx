"use client"

import { useParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LanguageOption {
  code: string
  name: string
  flag: string
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '' },
  { code: 'fr', name: 'Français', flag: '' },
]

export function LanguageSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const t = useTranslations('auth')
  
  // Better locale detection from params and pathname
  const currentLocale = (params.locale as string) || 
    (pathname.startsWith('/fr') ? 'fr' : 'en')

  const handleLanguageChange = (newLocale: string) => {
    // Create the new path by replacing the current locale with the new locale
    // Handle both cases: when the locale is explicitly in the path and when it's implicit
    let newPath = pathname
    
    if (pathname.startsWith(`/${currentLocale}/`)) {
      // Explicit locale in path - replace it
      newPath = pathname.replace(`/${currentLocale}/`, `/${newLocale}/`)
    } else if (pathname === `/${currentLocale}`) {
      // Exact locale path - replace it
      newPath = `/${newLocale}`
    } else if (currentLocale === 'en' && !pathname.startsWith('/en')) {
      // Default locale (en) is implicit - add the new locale
      newPath = `/${newLocale}${pathname}`
    } else {
      // Fallback - prepend the new locale
      newPath = `/${newLocale}${pathname}`
    }
    
    router.push(newPath)
  }

  const currentLanguage = languages.find(lang => lang.code === currentLocale)

  return (
    <Select value={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue>
            {currentLanguage ? (
              <span className="flex items-center gap-2">
                <span>{currentLanguage.flag}</span>
                <span>{currentLanguage.name}</span>
              </span>
            ) : (
              t('selectLanguage')
            )}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}