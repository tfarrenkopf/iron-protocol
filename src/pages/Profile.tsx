import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMyAssignments } from "@/hooks/useAssignments";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab";
import { ProfileHandlerOpsTab } from "@/components/profile/ProfileHandlerOpsTab";
import { ProfileProgressTab } from "@/components/profile/ProfileProgressTab";
import { ProfileHistoryTab } from "@/components/profile/ProfileHistoryTab";
import { ProfileNotificationsTab } from "@/components/profile/ProfileNotificationsTab";
import { ProfileSettingsTab } from "@/components/profile/ProfileSettingsTab";

type TabType = 'overview' | 'handler-ops' | 'progress' | 'history' | 'notifications' | 'settings';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'handler-ops', label: 'Handler Ops', icon: ClipboardList },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'history', label: 'History', icon: History },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAnonymous } = useAuth();
  const { isLoading } = useProfile();
  const { data: assignments } = useMyAssignments();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Calculate notification badge (for future use)
  const activeOrderCount = assignments?.filter((a: any) => a.status !== 'COMPLETED').length || 0;

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

            {/* Tab Navigation */}
            <div className="relative">
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                <div className="flex gap-1 min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const showBadge = tab.id === 'handler-ops' && activeOrderCount > 0;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-display rounded-lg transition-all snap-start touch-manipulation ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">
                          {tab.label === 'Handler Ops' ? 'Orders' : 
                           tab.label === 'Notifications' ? 'Alerts' :
                           tab.label}
                        </span>
                        
                        {/* Badge for active orders */}
                        {showBadge && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-section-orders text-white text-[10px] font-display rounded-full flex items-center justify-center">
                            {activeOrderCount > 9 ? '9+' : activeOrderCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
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
