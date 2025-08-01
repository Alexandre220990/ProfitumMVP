import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { UnifiedCalendar } from '@/components/UnifiedCalendar';
import HeaderAdmin from '@/components/HeaderAdmin';

export default function AgendaAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirection si non connecté
  if (!user) {
    navigate('/connect-admin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <HeaderAdmin />
      
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mt-16"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Calendrier Admin</h1>
              <p className="text-slate-600">
                Supervision et gestion des événements de la plateforme
              </p>
            </div>
          </div>
        </div>

        {/* Calendrier unifié */}
        <UnifiedCalendar 
          theme="purple"
          showHeader={false}
          enableGoogleSync={true}
          enableRealTime={true}
          defaultView="list"
          filters={{
            category: 'admin'
          }}
        />
      </div>
    </div>
  );
} 