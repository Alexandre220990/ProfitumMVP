/**
 * Helper functions for admin notifications
 * Replaces AdminNotificationWithStatus view with direct queries
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface AdminNotificationWithStatus {
  id: string;
  type: string;
  notification_type: string;
  title: string;
  message: string;
  global_status: string;
  status: string;
  priority: string;
  metadata: any;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
  updated_at: string;
  read_at: string | null;
  archived_at: string | null;
  handled_by: string | null;
  handled_at: string | null;
  is_read: boolean;
  admin_notes: string | null;
  // From AdminNotificationStatus
  admin_id: string;
  user_read_at: string | null;
  is_archived: boolean;
  user_archived_at: string | null;
  user_status: 'read' | 'unread' | 'archived';
}

interface GetAdminNotificationsOptions {
  adminDatabaseId: string;
  authUserId: string;
  status?: 'all' | 'read' | 'unread' | 'archived';
  priority?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get admin notifications with their individual statuses
 * Replaces AdminNotificationWithStatus view
 */
export async function getAdminNotificationsWithStatus(
  supabaseClient: SupabaseClient,
  options: GetAdminNotificationsOptions
): Promise<{ data: AdminNotificationWithStatus[] | null; error: any }> {
  const { adminDatabaseId, authUserId, status, priority, limit, offset } = options;

  try {
    // 1. Récupérer les notifications depuis notification
    let query = supabaseClient
      .from('notification')
      .select(`
        id,
        notification_type,
        title,
        message,
        status,
        priority,
        metadata,
        action_url,
        action_data,
        created_at,
        updated_at,
        read_at,
        archived_at,
        is_read,
        user_id,
        user_type
      `)
      .eq('user_type', 'admin')
      .eq('user_id', authUserId)
      .neq('status', 'replaced')
      .eq('hidden_in_list', false)
      .order('created_at', { ascending: false });

    // Filtrer par statut de lecture
    if (status && status !== 'all') {
      if (status === 'unread') {
        query = query.eq('is_read', false);
      } else if (status === 'read') {
        query = query.eq('is_read', true);
      }
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 100) - 1);
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      return { data: null, error: notificationsError };
    }

    if (!notifications || notifications.length === 0) {
      return { data: [], error: null };
    }

    // 2. Récupérer les statuts individuels depuis AdminNotificationStatus
    const notificationIds = notifications.map(n => n.id);
    const { data: statuses, error: statusesError } = await supabaseClient
      .from('AdminNotificationStatus')
      .select('*')
      .eq('admin_id', adminDatabaseId)
      .in('notification_id', notificationIds);

    if (statusesError) {
      console.error('❌ Erreur récupération AdminNotificationStatus:', statusesError);
      // Continue sans les statuts individuels
    }

    // 3. Créer un map des statuts par notification_id
    const statusMap = new Map<string, any>();
    if (statuses) {
      statuses.forEach(status => {
        statusMap.set(status.notification_id, status);
      });
    }

    // 4. Enrichir les notifications avec les statuts individuels
    const enrichedNotifications: AdminNotificationWithStatus[] = notifications.map(notif => {
      const individualStatus = statusMap.get(notif.id);
      
      // Déterminer is_read : priorité à AdminNotificationStatus, sinon notification.is_read
      const isRead = individualStatus?.is_read ?? notif.is_read ?? false;
      const isArchived = individualStatus?.is_archived ?? false;

      // Calculer user_status
      let userStatus: 'read' | 'unread' | 'archived';
      if (isArchived) {
        userStatus = 'archived';
      } else if (isRead) {
        userStatus = 'read';
      } else {
        userStatus = 'unread';
      }

      // Récupérer admin_id : depuis AdminNotificationStatus ou calculer depuis user_id
      const adminId = individualStatus?.admin_id ?? adminDatabaseId;

      return {
        id: notif.id,
        type: notif.notification_type,
        notification_type: notif.notification_type,
        title: notif.title,
        message: notif.message,
        global_status: notif.status,
        status: notif.status,
        priority: notif.priority,
        metadata: notif.metadata,
        action_url: notif.action_url,
        action_label: notif.action_data?.action_label || null,
        created_at: notif.created_at,
        updated_at: notif.updated_at,
        read_at: notif.read_at,
        archived_at: notif.archived_at,
        handled_by: null,
        handled_at: null,
        is_read: isRead,
        admin_notes: notif.metadata?.admin_notes || null,
        // From AdminNotificationStatus
        admin_id: adminId,
        user_read_at: individualStatus?.read_at || null,
        is_archived: isArchived,
        user_archived_at: individualStatus?.archived_at || null,
        user_status: userStatus,
      };
    });

    // 5. Filtrer par user_status si demandé
    let filteredNotifications = enrichedNotifications;
    if (status && status !== 'all') {
      filteredNotifications = enrichedNotifications.filter(n => n.user_status === status);
    }

    return { data: filteredNotifications, error: null };
  } catch (error) {
    console.error('❌ Erreur getAdminNotificationsWithStatus:', error);
    return { data: null, error };
  }
}

/**
 * Get a single admin notification with its status
 */
export async function getAdminNotificationWithStatusById(
  supabaseClient: SupabaseClient,
  notificationId: string,
  adminDatabaseId: string
): Promise<{ data: AdminNotificationWithStatus | null; error: any }> {
  try {
    // 1. Récupérer la notification
    const { data: notification, error: notifError } = await supabaseClient
      .from('notification')
      .select('*')
      .eq('id', notificationId)
      .eq('user_type', 'admin')
      .single();

    if (notifError || !notification) {
      return { data: null, error: notifError || new Error('Notification not found') };
    }

    // 2. Récupérer le statut individuel
    const { data: individualStatus } = await supabaseClient
      .from('AdminNotificationStatus')
      .select('*')
      .eq('notification_id', notificationId)
      .eq('admin_id', adminDatabaseId)
      .single();

    // 3. Enrichir
    const isRead = individualStatus?.is_read ?? notification.is_read ?? false;
    const isArchived = individualStatus?.is_archived ?? false;

    let userStatus: 'read' | 'unread' | 'archived';
    if (isArchived) {
      userStatus = 'archived';
    } else if (isRead) {
      userStatus = 'read';
    } else {
      userStatus = 'unread';
    }

    const enriched: AdminNotificationWithStatus = {
      id: notification.id,
      type: notification.notification_type,
      notification_type: notification.notification_type,
      title: notification.title,
      message: notification.message,
      global_status: notification.status,
      status: notification.status,
      priority: notification.priority,
      metadata: notification.metadata,
      action_url: notification.action_url,
      action_label: notification.action_data?.action_label || null,
      created_at: notification.created_at,
      updated_at: notification.updated_at,
      read_at: notification.read_at,
      archived_at: notification.archived_at,
      handled_by: null,
      handled_at: null,
      is_read: isRead,
      admin_notes: notification.metadata?.admin_notes || null,
      admin_id: individualStatus?.admin_id ?? adminDatabaseId,
      user_read_at: individualStatus?.read_at || null,
      is_archived: isArchived,
      user_archived_at: individualStatus?.archived_at || null,
      user_status: userStatus,
    };

    return { data: enriched, error: null };
  } catch (error) {
    console.error('❌ Erreur getAdminNotificationWithStatusById:', error);
    return { data: null, error };
  }
}

/**
 * Enrich a notification object with status information
 */
export function enrichNotificationWithStatus(
  notification: any,
  individualStatus: any | null,
  adminDatabaseId: string
): AdminNotificationWithStatus {
  const isRead = individualStatus?.is_read ?? notification.is_read ?? false;
  const isArchived = individualStatus?.is_archived ?? false;

  let userStatus: 'read' | 'unread' | 'archived';
  if (isArchived) {
    userStatus = 'archived';
  } else if (isRead) {
    userStatus = 'read';
  } else {
    userStatus = 'unread';
  }

  return {
    id: notification.id,
    type: notification.notification_type,
    notification_type: notification.notification_type,
    title: notification.title,
    message: notification.message,
    global_status: notification.status,
    status: notification.status,
    priority: notification.priority,
    metadata: notification.metadata,
    action_url: notification.action_url,
    action_label: notification.action_data?.action_label || null,
    created_at: notification.created_at,
    updated_at: notification.updated_at,
    read_at: notification.read_at,
    archived_at: notification.archived_at,
    handled_by: null,
    handled_at: null,
    is_read: isRead,
    admin_notes: notification.metadata?.admin_notes || null,
    admin_id: individualStatus?.admin_id ?? adminDatabaseId,
    user_read_at: individualStatus?.read_at || null,
    is_archived: isArchived,
    user_archived_at: individualStatus?.archived_at || null,
    user_status: userStatus,
  };
}
