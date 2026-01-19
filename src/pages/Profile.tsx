import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  LayoutGrid, 
  ClipboardList, 
  TrendingUp, 
  History, 
  Bell, 
  Settings 
} from "lucide-react";
import { GlobalNav } from "@/components/GlobalNav";
import { AppFooter } from "@/components/AppFooter";
import { SecondaryNav, SecondaryNavTab } from "@/components/SecondaryNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab";
import { ProfileHandlerOpsTab } from "@/components/profile/ProfileHandlerOpsTab";
import { ProfileProgressTab } from "@/components/profile/ProfileProgressTab";
import { ProfileHistoryTab } from "@/components/profile/ProfileHistoryTab";
import { ProfileNotificationsTab } from "@/components/profile/ProfileNotificationsTab";
import { ProfileSettingsTab } from "@/components/profile/ProfileSettingsTab";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAnonymous } = useAuth();
  const { isLoading } = useProfile();
  const { data: unreadCount } = useUnreadNotificationCount();
  
  // Read tab from URL query parameter, default to 'overview'
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  // Sync tab state with URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs: SecondaryNavTab[] = [
    { id: 'overview', label: 'OVERVIEW', shortLabel: 'OVERVIEW', icon: LayoutGrid },
    { id: 'handler-ops', label: 'HANDLER OPS', shortLabel: 'ORDERS', icon: ClipboardList },
    { id: 'progress', label: 'PROGRESS', shortLabel: 'PROGRESS', icon: TrendingUp },
    { id: 'history', label: 'HISTORY', shortLabel: 'HISTORY', icon: History },
    { id: 'notifications', label: 'ALERTS', shortLabel: 'ALERTS', icon: Bell, badge: unreadCount && unreadCount > 0 ? unreadCount : undefined },
    { id: 'settings', label: 'SETTINGS', shortLabel: 'SETTINGS', icon: Settings },
  ];

  // Redirect anonymous users to auth
  if (isAnonymous) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
        <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="font-display text-3xl text-primary mb-4">ACCESS DENIED</h1>
            <p className="text-muted-foreground mb-6">You must authenticate to view your profile.</p>
            <button
              onClick={() => navigate("/auth")}
              className="px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
            >
              AUTHENTICATE
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
        {/* Header - Calmer, reflective tone */}
        <GlobalNav 
          title="SERVICE RECORD"
          subtitle="IDENTITY • OBLIGATIONS • HISTORY"
        />

        {isLoading ? (
          <div className="text-center py-8">
            <div className="font-display text-xl text-primary animate-neon-pulse">LOADING...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile Header (Identity) */}
            <ProfileHeader />

            {/* Tab Navigation - Using SecondaryNav for consistency */}
            <SecondaryNav
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              section="profile"
            />

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {activeTab === 'overview' && <ProfileOverviewTab />}
              {activeTab === 'handler-ops' && <ProfileHandlerOpsTab />}
              {activeTab === 'progress' && <ProfileProgressTab />}
              {activeTab === 'history' && <ProfileHistoryTab />}
              {activeTab === 'notifications' && <ProfileNotificationsTab />}
              {activeTab === 'settings' && <ProfileSettingsTab />}
            </div>
          </div>
        )}

        {/* Footer */}
        <AppFooter />
      </div>
    </div>
  );
};

export default ProfilePage;
