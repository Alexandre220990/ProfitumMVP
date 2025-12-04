import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, ChevronDown, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSupabaseToken } from '@/lib/auth-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================================
// CONFIGURATION
// ============================================================================

const TYPE_LABELS: Record<string, string> = {
  client: 'Client',
  expert: 'Expert',
  apporteur: 'Apporteur',
  admin: 'Admin'
};

const TYPE_COLORS: Record<string, string> = {
  client: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  expert: 'bg-green-100 text-green-800 hover:bg-green-200',
  apporteur: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  admin: 'bg-red-100 text-red-800 hover:bg-red-200'
};

const TYPE_DASHBOARDS: Record<string, string> = {
  client: '/client/dashboard',
  expert: '/expert/dashboard',
  apporteur: '/apporteur/dashboard',
  admin: '/admin/dashboard-optimized'
};

// ============================================================================
// COMPOSANT
// ============================================================================

export const TypeSwitcher = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  
  // Ne pas afficher si un seul type ou pas de types disponibles
  if (!user?.available_types || user.available_types.length <= 1) {
    return null;
  }
  
  const handleSwitchType = async (newType: string) => {
    if (newType === user.type || switching) return;
    
    setSwitching(true);
    
    try {
      const token = await getSupabaseToken();
      const response = await fetch('/api/auth/switch-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_type: newType })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Sauvegarder le nouveau token
        localStorage.setItem('token', result.data.token);
        
        toast.success(`Passage en mode ${TYPE_LABELS[newType]}`);
        
        // Rediriger vers le dashboard approprié
        const targetDashboard = TYPE_DASHBOARDS[newType];
        if (targetDashboard) {
          navigate(targetDashboard);
          
          // Recharger pour appliquer le nouveau contexte
          setTimeout(() => window.location.reload(), 100);
        }
      } else {
        toast.error(result.message || 'Erreur lors du changement de profil');
      }
    } catch (error) {
      console.error('Erreur switch type:', error);
      toast.error('Erreur lors du changement de profil');
    } finally {
      setSwitching(false);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            TYPE_COLORS[user.type]
          } ${switching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={switching}
        >
          <Users className="w-4 h-4" />
          <span className="font-semibold text-sm">
            {TYPE_LABELS[user.type]}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
          Changer de profil
        </div>
        {user.available_types.map((type: string) => (
          <DropdownMenuItem 
            key={type}
            onClick={() => handleSwitchType(type)}
            disabled={type === user.type || switching}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
              type === user.type ? 'bg-gray-50' : ''
            }`}
          >
            {type === user.type && (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
            {type !== user.type && (
              <div className="w-4 h-4 flex-shrink-0" />
            )}
            <Badge 
              variant="outline" 
              className={`${TYPE_COLORS[type]} border-0`}
            >
              {TYPE_LABELS[type]}
            </Badge>
            {type === user.type && (
              <span className="ml-auto text-xs text-gray-500">Actuel</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

