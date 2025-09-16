import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
        <p className="text-gray-600 mb-6">{t('description')}</p>
        <a href="/" className="text-blue-600 hover:text-blue-800">
          {t('backHome')}
        </a>
      </div>
    </div>
  );
}