/**
 * Auto-generated Types for: notifications/notifications
 * Sinh tự động từ endpoint Backend
 */
import type { NotificationEntityType, NotificationType } from '../common/enums'

export interface NotificationItem {
    notification_id?: string | null
    type?: NotificationType
    title?: string | null
    body?: string | null
    entity_type?: NotificationEntityType
    entity_id?: string | null
    created_at?: string | null
    read_at?: string | null
}

export interface NotificationPage {
    page?: number
    page_size?: number
    total?: number
    unread_count?: number
    items?: NotificationItem[]
}

