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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Agenda</h1>
            <p className="text-gray-600">
              Gérez vos rendez-vous avec les experts et clients
            </p>
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
