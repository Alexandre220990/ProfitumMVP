import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { UnifiedCalendar } from '@/components/UnifiedCalendar';

export default function ApporteurAgenda() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirection si non connecté
  if (!user) {
    navigate('/apporteur/login');
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Mon Agenda</h1>
              <p className="text-sm text-gray-600">
                Gérez vos rendez-vous avec les experts et clients
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendrier unifié */}
      <UnifiedCalendar 
        theme="blue"
        showHeader={false}
        enableGoogleSync={true}
        enableRealTime={true}
        defaultView="month"
      />
    </div>
  );
}
