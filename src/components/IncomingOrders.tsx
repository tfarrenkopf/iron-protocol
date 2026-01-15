import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, User, Users, ChevronRight, Play } from 'lucide-react';
import { useMyAssignments } from '@/hooks/useAssignments';
import { formatDistanceToNow } from 'date-fns';

export function IncomingOrders() {
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useMyAssignments();

  const activeAssignments = assignments?.filter(a => a.status !== 'COMPLETED') || [];

  if (isLoading) {
    return (
      <div className="bg-card border border-warning/30 rounded-lg p-4">
        <div className="text-center text-muted-foreground">Loading orders...</div>
      </div>
    );
  }

  if (activeAssignments.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-warning" />
        <h3 className="font-display text-xl text-warning tracking-wider">
          INCOMING ORDERS
        </h3>
        <span className="ml-auto bg-warning/20 text-warning text-xs font-display px-2 py-1 rounded">
          {activeAssignments.length} PENDING
        </span>
      </div>

      <div className="space-y-3">
        {activeAssignments.map((assignment, i) => {
          const mission = assignment.mission_snapshot;
          const isInProgress = assignment.status === 'IN_PROGRESS';
          
          return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`group bg-card border rounded-lg p-4 ${
                isInProgress 
                  ? 'border-secondary/50 bg-secondary/5' 
                  : 'border-warning/30 hover:border-warning/60'
              } transition-all`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {isInProgress && (
                      <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded font-display">
                        IN PROGRESS
                      </span>
                    )}
                    <span className="font-display text-lg text-primary truncate">
                      {mission.code_name}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {mission.description || mission.name}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>From: {assignment.handler_name || 'Handler'}</span>
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

                  {assignment.due_at && (
                    <div className="mt-2 text-xs text-warning">
                      Due: {formatDistanceToNow(new Date(assignment.due_at), { addSuffix: true })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/workout/assignment/${assignment.id}`)}
                  className={`flex-shrink-0 p-3 rounded-lg transition-all ${
                    isInProgress
                      ? 'bg-secondary text-secondary-foreground hover:opacity-90'
                      : 'bg-warning/20 text-warning hover:bg-warning/30'
                  }`}
                >
                  {isInProgress ? (
                    <ChevronRight className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
