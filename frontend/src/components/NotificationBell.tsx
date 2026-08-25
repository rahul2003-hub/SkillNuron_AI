import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '../services/api';

interface NotificationItem {
    id: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const load = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = async () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next && unreadCount > 0) {
            try {
                await markNotificationsRead();
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (err) {
                console.error('Failed to mark notifications read:', err);
            }
        }
    };

    return (
        <div className="dropdown dropdown-end" ref={containerRef}>
            <button
                onClick={handleToggle}
                className="btn btn-ghost btn-circle"
                aria-label="Notifications"
            >
                <div className="indicator">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="badge badge-error badge-xs indicator-item">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </div>
            </button>
            {isOpen && (
                <div className="dropdown-content menu bg-base-100 rounded-box shadow-lg border border-base-300 w-80 max-h-96 overflow-y-auto z-30 mt-2 p-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-base-content/50 uppercase tracking-wider">Notifications</div>
                    {notifications.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-base-content/50">No notifications yet</div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={`px-2 py-2.5 rounded-lg text-sm flex items-start gap-2 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-base-content">{n.message}</p>
                                    <p className="text-xs text-base-content/50 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}