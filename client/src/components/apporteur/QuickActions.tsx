import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3,
  Plus,
  Clock,
  Mail,
  TrendingUp
} from 'lucide-react';

interface QuickActionsProps {
  onNewProspect?: () => void;
  onScheduleMeeting?: () => void;
  onSendMessage?: () => void;
  onViewStats?: () => void;
}

export function QuickActions({ 
  onNewProspect, 
  onScheduleMeeting, 
  onSendMessage, 
  onViewStats 
}: QuickActionsProps) {
  const navigate = useNavigate();

  const handleNewProspect = () => {
    if (onNewProspect) {
      onNewProspect();
    } else {
      navigate('/apporteur/prospects');
    }
  };

  const handleScheduleMeeting = () => {
    if (onScheduleMeeting) {
      onScheduleMeeting();
    } else {
      navigate('/apporteur/meetings');
    }
  };

  const handleSendMessage = () => {
    if (onSendMessage) {
      onSendMessage();
    } else {
      navigate('/apporteur/messaging');
    }
  };

  const handleViewStats = () => {
    if (onViewStats) {
      onViewStats();
    } else {
      navigate('/apporteur/statistics');
    }
  };

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            handleNewProspect();
            break;
          case 'm':
            event.preventDefault();
            handleScheduleMeeting();
            break;
          case 'e':
            event.preventDefault();
            handleSendMessage();
            break;
          case 's':
            event.preventDefault();
            handleViewStats();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Button 
        onClick={handleNewProspect}
        className="h-20 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-6 w-6 mr-2" />
            <Plus className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Nouveau Prospect</div>
          <div className="text-xs opacity-90">Ctrl+N</div>
        </div>
      </Button>

      <Button 
        onClick={handleScheduleMeeting}
        className="h-20 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-6 w-6 mr-2" />
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Planifier RDV</div>
          <div className="text-xs opacity-90">Ctrl+M</div>
        </div>
      </Button>

      <Button 
        onClick={handleSendMessage}
        className="h-20 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <MessageSquare className="h-6 w-6 mr-2" />
            <Mail className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Messagerie</div>
          <div className="text-xs opacity-90">Ctrl+E</div>
        </div>
      </Button>

      <Button 
        onClick={handleViewStats}
        className="h-20 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BarChart3 className="h-6 w-6 mr-2" />
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Statistiques</div>
          <div className="text-xs opacity-90">Ctrl+S</div>
        </div>
      </Button>
    </div>
  );
}
