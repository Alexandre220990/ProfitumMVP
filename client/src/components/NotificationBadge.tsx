// React import removed 'react';
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationBadgeProps { unreadCount: number;
  onClick: () => void;
  className?: string }

export default function NotificationBadge({ unreadCount, onClick, className = "" }: NotificationBadgeProps) { return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick }
      className={ `relative p-2 ${className }`}
      aria-label={ `${unreadCount } notification${ unreadCount > 1 ? 's' : '' } non lue${ unreadCount > 1 ? 's' : '' }`}
    >
      <Bell className="w-5 h-5 text-gray-600" />
      
      { unreadCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-0"
          variant="destructive"
        >
          {unreadCount > 99 ? '99+' : unreadCount }
        </Badge>
      )}
    </Button>
  );
} 