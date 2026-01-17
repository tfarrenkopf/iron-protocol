import { motion } from "framer-motion";
import { 
  Shield, 
  Target, 
  Zap, 
  TrendingUp, 
  Clock, 
  RefreshCw,
  Activity,
  BarChart3,
  Users,
  Weight,
  Trophy
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useWarReport, 
  formatCompletionTime, 
  formatLargeNumber,
  getFocusAreaLabel 
} from "@/hooks/useWarReport";

const WarReport = () => {
  const { data: report, isLoading, error } = useWarReport();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-pixel text-2xl text-destructive mb-2">INTEL UNAVAILABLE</h1>
          <p className="text-muted-foreground">War Report data could not be retrieved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              ←
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="font-pixel text-lg">WAR REPORT</h1>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            INTEL BRIEF
          </Badge>
        </div>
      </div>

      <motion.div 
        className="max-w-4xl mx-auto px-4 py-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Trust Message */}
        <motion.div 
          variants={itemVariants}
          className="bg-muted/30 border border-border rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">
                All data shown is <span className="text-foreground font-medium">aggregated and anonymized</span>.
                Player identities are protected by design.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                War Report is part of an early Alpha system. Data and visuals are evolving — feedback welcome.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div variants={itemVariants}>
          <h2 className="font-pixel text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            WEEKLY OVERVIEW
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="Campaigns Active"
              value={isLoading ? null : report?.totalCampaignsActive || 0}
            />
            <StatCard
              icon={<Trophy className="w-5 h-5" />}
              label="Total Completions"
              value={isLoading ? null : report?.totalCompletionsThisWeek || 0}
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Players Engaged"
              value={isLoading ? null : report?.totalPlayersThisWeek || 0}
            />
            <StatCard
              icon={<Weight className="w-5 h-5" />}
              label="Weight Moved"
              value={isLoading ? null : formatLargeNumber(report?.totalWeightThisWeek || 0)}
              suffix="lbs"
            />
          </div>
        </motion.div>

        {/* Most Completed Campaigns */}
        <motion.div variants={itemVariants}>
          <CampaignSection
            title="MOST COMPLETED CAMPAIGNS"
            icon={<TrendingUp className="w-4 h-4" />}
            campaigns={report?.mostCompletedCampaigns || []}
            isLoading={isLoading}
            metric="completions"
          />
        </motion.div>

        {/* Fastest Campaigns */}
        <motion.div variants={itemVariants}>
          <CampaignSection
            title="SPEED RECORDS"
            icon={<Zap className="w-4 h-4" />}
            campaigns={report?.fastestCampaigns || []}
            isLoading={isLoading}
            metric="speed"
          />
        </motion.div>

        {/* Most Replayed */}
        <motion.div variants={itemVariants}>
          <CampaignSection
            title="GRINDER FAVORITES"
            icon={<RefreshCw className="w-4 h-4" />}
            campaigns={report?.mostReplayedCampaigns || []}
            isLoading={isLoading}
            metric="replay"
          />
        </motion.div>

        {/* Highest Scoring */}
        <motion.div variants={itemVariants}>
          <CampaignSection
            title="DAMAGE LEADERS"
            icon={<Target className="w-4 h-4" />}
            campaigns={report?.highestScoringCampaigns || []}
            isLoading={isLoading}
            metric="score"
          />
        </motion.div>

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="text-center py-8 border-t border-border"
        >
          <p className="font-pixel text-xs text-muted-foreground">
            WAR REPORT :: ALPHA INTEL SYSTEM
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Updated weekly • No player identifiers stored
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string | null;
  suffix?: string;
}

const StatCard = ({ icon, label, value, suffix }: StatCardProps) => (
  <Card className="bg-card/50 border-border">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs font-mono uppercase">{label}</span>
      </div>
      {value === null ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="font-pixel text-2xl text-foreground">
          {value}
          {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
        </div>
      )}
    </CardContent>
  </Card>
);

// Campaign Section Component
interface CampaignSectionProps {
  title: string;
  icon: React.ReactNode;
  campaigns: any[];
  isLoading: boolean;
  metric: 'completions' | 'speed' | 'replay' | 'score';
}

const CampaignSection = ({ title, icon, campaigns, isLoading, metric }: CampaignSectionProps) => {
  const getMetricValue = (campaign: any) => {
    switch (metric) {
      case 'completions':
        return `${campaign.total_completions} runs`;
      case 'speed':
        return formatCompletionTime(campaign.fastest_completion_seconds);
      case 'replay':
        return `${campaign.replay_rate.toFixed(0)}% replay`;
      case 'score':
        return `${formatLargeNumber(campaign.total_score)} pts`;
      default:
        return '';
    }
  };

  return (
    <Card className="bg-card/30 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="font-pixel text-sm flex items-center gap-2 text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data available this week
          </p>
        ) : (
          campaigns.map((campaign, index) => (
            <Link
              key={campaign.id}
              to={`/campaign/${campaign.campaign_id}`}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="font-pixel text-lg text-primary w-6">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {campaign.campaign_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs font-mono">
                      {getFocusAreaLabel(campaign)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {campaign.unique_players_count} players
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-pixel text-sm text-primary">
                  {getMetricValue(campaign)}
                </p>
                {metric === 'speed' && (
                  <p className="text-xs text-muted-foreground">
                    avg {formatCompletionTime(campaign.average_completion_time_seconds)}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default WarReport;
