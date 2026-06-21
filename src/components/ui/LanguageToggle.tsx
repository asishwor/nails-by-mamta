'use client';

import { setLanguage } from '@/app/actions/locale';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from './button';

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();

  const handleToggle = async () => {
    const newLocale = locale === 'en' ? 'ne' : 'en';
    await setLanguage(newLocale);
    router.refresh();
  };

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      aria-label="Toggle Language"
    >
      {locale === 'en' ? '🇳🇵 Nepali' : '🇬🇧 English'}
    </Button>
  );
}
