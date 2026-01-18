import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, User, Users, ChevronRight, Eye, Check, Flame } from 'lucide-react';
import { useMyAssignments } from '@/hooks/useAssignments';
import { formatDistanceToNow } from 'date-fns';

export function IncomingOrders() {
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useMyAssignments();

  const activeAssignments = assignments?.filter(a => a.status !== 'COMPLETED') || [];
  const completedCount = assignments?.filter(a => a.status === 'COMPLETED').length || 0;
  const totalCount = assignments?.length || 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-section-orders/30 rounded-lg p-4"
      >
        <div className="text-center text-muted-foreground">Loading orders...</div>
      </motion.div>
    );
  }

  if (totalCount === 0) {
    return null;
  }

  const handleReviewOrder = (assignment: any) => {
    const missionSnapshot = assignment.mission_snapshot;
    // Check if this is a campaign or mission assignment
    if (missionSnapshot?.is_campaign && missionSnapshot?.campaign_id) {
      navigate(`/campaign/${missionSnapshot.campaign_id}`);
    } else if (missionSnapshot?.id) {
      navigate(`/mission/${missionSnapshot.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-section-orders/30 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-section-orders" />
            <h3 className="font-display text-lg text-section-orders">
              INCOMING ORDERS
            </h3>
          </div>
          {activeAssignments.length > 0 && (
            <span className="bg-section-orders/20 text-section-orders text-xs font-display px-2 py-1 rounded">
              {activeAssignments.length} PENDING
            </span>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="font-display text-xl text-section-orders">{activeAssignments.length}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">ACTIVE</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-success">{completedCount}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">DONE</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-muted-foreground">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">RATE</div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {activeAssignments.length > 0 ? (
        <div className="p-4 space-y-3">
          {activeAssignments.slice(0, 3).map((assignment, i) => {
            const mission = assignment.mission_snapshot;
            const isInProgress = assignment.status === 'IN_PROGRESS';
            
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-background border rounded-lg p-3 ${
                  isInProgress 
                    ? 'border-secondary/50' 
                    : 'border-section-orders/30 hover:border-section-orders/60'
                } transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isInProgress && (
                        <span className="text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-display">
                          ACTIVE
                        </span>
                      )}
                      <span className="font-display text-sm text-primary truncate">
                        {mission.code_name}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {mission.description || mission.name}
                    </p>

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

                  <button
                    onClick={() => handleReviewOrder(assignment)}
                    className="flex-shrink-0 p-2 rounded-lg bg-section-orders/10 text-section-orders hover:bg-section-orders/20 transition-all"
                    title="Review order details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          
          {activeAssignments.length > 3 && (
            <div className="text-center text-xs text-muted-foreground pt-2">
              +{activeAssignments.length - 3} more orders
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center">
          <Check className="w-8 h-8 mx-auto mb-2 text-success/50" />
          <p className="text-sm text-muted-foreground">All orders complete!</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {completedCount} mission{completedCount !== 1 ? 's' : ''} completed
          </p>
        </div>
      )}
    </motion.div>
  );
}
