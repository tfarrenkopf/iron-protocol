import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, User, Users, Clock, Eye, FileText, Shield, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyAssignments } from "@/hooks/useAssignments";
import { useIsHandler, useMySquads, useLeaveSquad, useUpdateMemberStats } from "@/hooks/useHandlerMode";
import { formatDistanceToNow } from "date-fns";

export function ProfileHandlerOpsTab() {
  const navigate = useNavigate();
  const { data: myAssignments, isLoading: assignmentsLoading } = useMyAssignments();
  const { data: isHandler } = useIsHandler();
  const { data: mySquads } = useMySquads();
  const leaveSquad = useLeaveSquad();
  const updateMemberStats = useUpdateMemberStats();

  const activeAssignments = myAssignments?.filter((a: any) => a.status !== 'COMPLETED') || [];
  const completedAssignments = myAssignments?.filter((a: any) => a.status === 'COMPLETED') || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Handler CTA (if handler) */}
      {isHandler && (
        <div className="bg-card border border-secondary/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-secondary" />
              <div>
                <div className="font-display text-sm text-secondary">HANDLER MODE ACTIVE</div>
                <div className="text-xs text-muted-foreground">You can assign missions</div>
              </div>
            </div>
            <button
              onClick={() => navigate("/handler")}
              className="flex items-center gap-1 px-3 py-2 bg-secondary/10 border border-secondary/30 text-secondary font-display text-sm rounded hover:bg-secondary/20 transition-colors"
            >
              OPS
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* My Squads */}
      {mySquads && mySquads.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-display text-muted-foreground">MY SQUADS</span>
          </div>
          <div className="space-y-2">
            {mySquads.map((membership: any) => (
              <div key={membership.id} className="bg-background border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-sm text-secondary">{membership.squads?.code_name}</span>
                  <button
                    onClick={() => leaveSquad.mutateAsync(membership.squads?.id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Leave
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Handler: {membership.squads?.profiles?.display_name || "Unknown"}
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-muted-foreground">Share stats</span>
                    <input
                      type="checkbox"
                      checked={membership.share_stats}
                      onChange={(e) =>
                        updateMemberStats.mutateAsync({
                          squadId: membership.squads?.id,
                          shareStats: e.target.checked,
                        })
                      }
                      className="w-3 h-3 accent-secondary"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground">
        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-foreground font-medium">What handlers see:</span> Only your call sign and missions completed. No personal data.
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-3 bg-card border border-border rounded-lg">
          <div className="font-display text-lg text-foreground">{activeAssignments.length}</div>
          <div className="text-xs text-muted-foreground">ACTIVE</div>
        </div>
        <div className="text-center p-3 bg-card border border-border rounded-lg">
          <div className="font-display text-lg text-foreground">{completedAssignments.length}</div>
          <div className="text-xs text-muted-foreground">DONE</div>
        </div>
        <div className="text-center p-3 bg-card border border-border rounded-lg">
          <div className="font-display text-lg text-foreground">
            {myAssignments && myAssignments.length > 0
              ? Math.round((completedAssignments.length / myAssignments.length) * 100)
              : 0}%
          </div>
          <div className="text-xs text-muted-foreground">RATE</div>
        </div>
      </div>

      {/* Active Orders */}
      {assignmentsLoading ? (
        <div className="text-center py-4">
          <div className="font-display text-sm text-primary animate-neon-pulse">LOADING...</div>
        </div>
      ) : activeAssignments.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <ClipboardList className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No active orders</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Orders from handlers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <ClipboardList className="w-4 h-4 text-section-orders" />
            <span className="text-sm font-display text-section-orders">ACTIVE ORDERS</span>
          </div>
          {activeAssignments.map((assignment: any) => (
            <OrderCard key={assignment.id} assignment={assignment} navigate={navigate} />
          ))}
        </div>
      )}

      {/* Completed Orders (collapsed) */}
      {completedAssignments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-display text-muted-foreground">
              COMPLETED ({completedAssignments.length})
            </span>
          </div>
          <div className="space-y-2">
            {completedAssignments.slice(0, 3).map((assignment: any) => (
              <OrderCard key={assignment.id} assignment={assignment} navigate={navigate} isCompleted />
            ))}
            {completedAssignments.length > 3 && (
              <div className="text-center text-xs text-muted-foreground py-2">
                +{completedAssignments.length - 3} more completed
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function OrderCard({ 
  assignment, 
  navigate, 
  isCompleted = false 
}: { 
  assignment: any; 
  navigate: (path: string) => void;
  isCompleted?: boolean;
}) {
  const mission = assignment.mission_snapshot;
  const isInProgress = assignment.status === 'IN_PROGRESS';

  return (
    <div 
      className={`bg-card border rounded-lg p-3 ${
        isCompleted 
          ? 'border-border opacity-60' 
          : isInProgress 
            ? 'border-secondary/50' 
            : 'border-section-orders/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isCompleted && (
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-display">
                DONE
              </span>
            )}
            {isInProgress && (
              <span className="text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-display">
                ACTIVE
              </span>
            )}
            <span className="font-display text-sm text-foreground truncate">
              {mission?.code_name || 'CLASSIFIED'}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{assignment.handler_name || 'Handler'}</span>
            </div>
            
            {assignment.squad_name && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{assignment.squad_name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(assignment.assigned_at))} ago</span>
            </div>
          </div>
        </div>

        {!isCompleted && (
          <button
            onClick={() => {
              if (mission?.is_campaign && mission?.campaign_id) {
                navigate(`/campaign/${mission.campaign_id}`);
              } else if (mission?.id) {
                navigate(`/mission/${mission.id}`);
              }
            }}
            className="flex-shrink-0 p-2 rounded-lg bg-section-orders/10 text-section-orders hover:bg-section-orders/20 transition-all"
            title="Review order"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
