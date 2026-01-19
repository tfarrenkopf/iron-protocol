import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Users, Target, Swords, Trophy, AlertCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  useDismissNotification,
  useDismissAllNotifications,
  type Notification,
  type NotificationType
} from "@/hooks/useNotifications";

// Icon mapping for notification types
const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  SQUAD_INVITE_ACCEPTED: Users,
  MISSION_ASSIGNED: Target,
  RIVAL_INVITE_ACCEPTED: Swords,
  BOSS_UPDATE: Trophy,
  WEEKLY_SUMMARY: BarChart3,
  SYSTEM_ALERT: AlertCircle,
};

// Color mapping for notification types
const TYPE_COLORS: Record<NotificationType, string> = {
  SQUAD_INVITE_ACCEPTED: 'text-section-intel',
  MISSION_ASSIGNED: 'text-section-orders',
  RIVAL_INVITE_ACCEPTED: 'text-section-rivals',
  BOSS_UPDATE: 'text-warning',
  WEEKLY_SUMMARY: 'text-primary',
  SYSTEM_ALERT: 'text-destructive',
};

function NotificationItem({ notification, onNavigate }: { 
  notification: Notification; 
  onNavigate: (path: string) => void;
}) {
  const markRead = useMarkNotificationRead();
  const dismiss = useDismissNotification();
  
  const Icon = TYPE_ICONS[notification.type] || Bell;
  const colorClass = TYPE_COLORS[notification.type] || 'text-muted-foreground';
  const isUnread = notification.status === 'unread';

  const handleClick = () => {
    if (isUnread) {
      markRead.mutate(notification.id);
    }
    onNavigate(notification.deep_link);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismiss.mutate(notification.id);
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markRead.mutate(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        "bg-card border rounded-lg p-4 cursor-pointer transition-all hover:bg-muted/30",
        isUnread ? "border-primary/50" : "border-border",
        notification.priority === 'high' && isUnread && "border-l-4 border-l-destructive"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isUnread ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon className={cn("w-5 h-5", isUnread ? colorClass : "text-muted-foreground")} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-display text-sm truncate",
              isUnread ? "text-foreground" : "text-muted-foreground"
            )}>
              {notification.title}
            </h4>
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className={cn(
            "text-sm mb-2 line-clamp-2",
            isUnread ? "text-foreground/80" : "text-muted-foreground"
          )}>
            {notification.body}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            <div className="flex items-center gap-1">
              {isUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleMarkRead}
                  disabled={markRead.isPending}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={handleDismiss}
                disabled={dismiss.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProfileNotificationsTab() {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const dismissAll = useDismissAllNotifications();

  const unreadCount = notifications?.filter(n => n.status === 'unread').length || 0;
  const hasNotifications = notifications && notifications.length > 0;

  const handleNavigate = (path: string) => {
    // Add returnTo parameter to ensure back navigation returns to notifications tab
    const separator = path.includes('?') ? '&' : '?';
    const returnTo = encodeURIComponent('/profile?tab=notifications');
    navigate(`${path}${separator}returnTo=${returnTo}`);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with actions */}
      {hasNotifications && (
        <div className="flex items-center justify-between">
          <div className="text-xs font-display text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} UNREAD` : 'ALL READ'}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => dismissAll.mutate()}
              disabled={dismissAll.isPending}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* Notification list */}
      {hasNotifications ? (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {notifications?.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg text-muted-foreground mb-2">NO ALERTS</h3>
          <p className="text-sm text-muted-foreground">
            You're all caught up. New alerts will appear here.
          </p>
        </div>
      )}

      {/* System info footer */}
      <div className="text-xs text-muted-foreground/50 text-center pt-4 border-t border-border">
        Notifications notify. Ops persist. Intel informs. Command decides.
      </div>
    </motion.div>
  );
}
