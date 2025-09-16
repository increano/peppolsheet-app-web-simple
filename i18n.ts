import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Validate locale and fallback to 'en' if invalid
  const validLocales = ['en', 'fr'];
  const validatedLocale = validLocales.includes(locale) ? locale : 'en';
  
  return {
    locale: validatedLocale,
    messages: (await import(`./messages/${validatedLocale}.json`)).default
  };
});