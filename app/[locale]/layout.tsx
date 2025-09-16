import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { RoleAuthProvider } from '@/lib/role-auth-context';
import { DebugAuth } from '@/components/auth/debug-auth';

export const metadata: Metadata = {
  title: 'Peppolsheet',
  description: 'E-invoice and cashflow management',
};

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: Props) {
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <RoleAuthProvider>
          {children}
          {/* <DebugAuth /> */}
        </RoleAuthProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}