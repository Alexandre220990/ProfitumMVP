import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import ClientLayout from '@/components/client/ClientLayout';
import ExpertLayout from '@/components/expert/ExpertLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import ApporteurLayout from '@/components/apporteur/ApporteurLayout';
import { UniversalNotificationCenter } from '@/components/notifications/UniversalNotificationCenter';

type LayoutComponentType = React.ComponentType<{ children?: React.ReactNode }>;

const layoutByRole: Record<string, LayoutComponentType> = {
  client: ClientLayout,
  expert: ExpertLayout,
  admin: AdminLayout,
  apporteur: ApporteurLayout,
};

const NotificationCenterPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  const LayoutComponent = useMemo<LayoutComponentType>(() => {
    if (!user?.type) {
      return ClientLayout;
    }
    return layoutByRole[user.type] ?? ClientLayout;
  }, [user?.type]);

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <LayoutComponent>
      <UniversalNotificationCenter mode="page" title="Centre de notifications" />
    </LayoutComponent>
  );
};

export default NotificationCenterPage;