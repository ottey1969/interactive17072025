import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, BarChart3, Lightbulb, FileText, Globe, Bot, CreditCard, Brain, CheckCircle, Zap } from "lucide-react";
import type { AIActivity } from "@/types";

interface AIActivityFeedProps {
  activities: AIActivity[];
  realTimeActivities: AIActivity[];
  className?: string;
}

export default function AIActivityFeed({ activities, realTimeActivities, className }: AIActivityFeedProps) {
  const allActivities = [...activities, ...realTimeActivities];
  
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'research': return Search;
      case 'analysis': return BarChart3;
      case 'strategy': return Lightbulb;
      case 'generation': return FileText;
      default: return Bot;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'research': return 'blue';
      case 'analysis': return 'purple';
      case 'strategy': return 'emerald';
      case 'generation': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
      case 'processing': return 'bg-yellow-400 animate-pulse';
      case 'completed': 
      case 'complete': return 'bg-green-400';
      case 'in_progress': return 'bg-blue-400 animate-spin';
      case 'queued': return 'bg-slate-600';
      case 'failed': return 'bg-red-400';
      default: return 'bg-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'complete':
        return <Badge className="bg-green-500/20 text-green-400 text-xs border-green-500/30">Complete</Badge>;
      case 'active':
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 text-xs border-yellow-500/30">Processing</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-400 text-xs border-blue-500/30">In Progress</Badge>;
      case 'queued':
        return <Badge className="bg-slate-500/20 text-slate-400 text-xs border-slate-500/30">Queued</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 text-xs border-red-500/30">Failed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 text-xs border-slate-500/30">Pending</Badge>;
    }
  };

  return (
    <ScrollArea className={`h-full p-6 ${className || ''}`}>
      {/* Header matching the image design */}
      <div className="flex items-center space-x-3 mb-6 bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Sofeia AI Live Processing...</h3>
        <div className="flex space-x-1 ml-auto">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
      
      <div className="space-y-3 mb-8">
        {allActivities.length > 0 ? (
          allActivities.map((activity, index) => {
            const Icon = getPhaseIcon(activity.phase);
            const phaseColor = getPhaseColor(activity.phase);
            
            return (
              <div
                key={activity.id || index}
                className="flex items-center justify-between text-sm bg-slate-800/30 border border-slate-600/30 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(activity.status)}`}></div>
                  <span className="text-slate-300">
                    {activity.phase === 'research' && '🔍 '}
                    {activity.phase === 'analysis' && '⚡ '}
                    {activity.phase === 'strategy' && '📊 '}
                    {activity.phase === 'generation' && '✨ '}
                    {activity.description}
                  </span>
                </div>
                {getStatusBadge(activity.status)}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Ready for your questions</p>
            <p className="text-slate-500 text-xs">Ask Sofeia anything about content strategy, SEO, or keyword research</p>
          </div>
        )}
      </div>

      {/* API Integrations Status */}
      <div>
        <h3 className="text-slate-300 font-medium mb-3">API Integrations</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Globe className="text-blue-400 w-4 h-4" />
              <span className="text-slate-300 text-sm">Perplexity AI</span>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Active
            </Badge>
          </div>
          
          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Bot className="text-purple-400 w-4 h-4" />
              <span className="text-slate-300 text-sm">Anthropic Claude</span>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Active
            </Badge>
          </div>

          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Bot className="text-orange-400 w-4 h-4" />
              <span className="text-slate-300 text-sm">Groq AI</span>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Active
            </Badge>
          </div>
          
          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="text-blue-400 w-4 h-4" />
              <span className="text-slate-300 text-sm">PayPal</span>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Connected
            </Badge>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
