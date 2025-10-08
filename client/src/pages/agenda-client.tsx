import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { UnifiedCalendar } from '@/components/UnifiedCalendar';

export default function AgendaClientPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirection si non connecté
  if (!user) {
    navigate('/connexion-client');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Mon Calendrier</h1>
              <p className="text-slate-600 text-sm">
                Gérez vos rendez-vous et événements en toute simplicité
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
          filters={{
            category: 'client'
          }}
        />
      </div>
    </div>
  );
} 