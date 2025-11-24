import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { Button } from '@/components/ui/button';

export function CookieBanner() {
  const { isVisible, acceptAll, rejectAll } = useCookieConsent();

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 text-sm text-gray-600">
            <p>
              Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation du site.{' '}
              <a 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                En savoir plus
              </a>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
              className="text-xs"
            >
              Refuser
            </Button>
            <Button
              size="sm"
              onClick={acceptAll}
              className="text-xs"
            >
              Accepter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

