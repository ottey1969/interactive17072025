import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Settings, User } from "lucide-react";
import SettingsModal from "@/components/modals/SettingsModal";
import PaymentModal from "@/components/modals/PaymentModal";
import { useAuth } from "@/hooks/use-auth";
import type { User as UserType } from "@/types";

export default function Header() {
  const [showSettings, setShowSettings] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  
  const { user, logoutMutation } = useAuth();

  const { data: userQuery } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });
  
  // Use auth context user or fallback to query user
  const currentUser = user || userQuery;

  // Calculate credits and questions display
  const isPremiumAgency = currentUser?.subscriptionType?.includes('premium-agency');
  const isAgency = currentUser?.subscriptionType?.includes('agency');
  
  // Check if user has credits (admin-granted or purchased)
  const userCredits = currentUser?.totalCredits || 0;
  const hasCredits = userCredits > 0;
  
  // If user has credits, show credits; otherwise show daily questions
  let displayInfo;
  if (currentUser?.isAdmin) {
    displayInfo = { 
      label: "Admin", 
      current: "∞", 
      total: "∞", 
      isUnlimited: true 
    };
  } else if (hasCredits) {
    displayInfo = { 
      label: "Credits", 
      current: userCredits, 
      total: userCredits, 
      isUnlimited: false 
    };
  } else {
    // Default to daily question system for free users
    const monthlyLimit = isPremiumAgency ? 1500 : 
      (isAgency ? 500 : 
       (currentUser?.isPremium ? 150 : 3));
    const questionsUsed = currentUser?.monthlyQuestionsUsed || 0;
    const questionsRemaining = Math.max(0, monthlyLimit - questionsUsed);
    
    displayInfo = { 
      label: "Questions", 
      current: questionsRemaining, 
      total: monthlyLimit, 
      isUnlimited: false 
    };
  }
  
  const isLimitReached = !displayInfo.isUnlimited && displayInfo.current === 0;

  return (
    <>
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ContentScale</h1>
              <p className="text-xs text-slate-400">Powered by Sofeia AI</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* AI Status Indicator */}
            <div className="flex items-center space-x-2 bg-emerald-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-sm">AI Active</span>
            </div>
            
            {/* Credits Counter */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isLimitReached ? 'bg-red-500/20' : (hasCredits ? 'bg-emerald-500/20' : 'bg-amber-500/20')
            }`}>
              <i className={`fas ${hasCredits ? 'fa-coins' : 'fa-question-circle'} ${
                isLimitReached ? 'text-red-400' : (hasCredits ? 'text-emerald-400' : 'text-amber-400')
              } text-xs`}></i>
              <span className={`text-sm ${
                isLimitReached ? 'text-red-400' : (hasCredits ? 'text-emerald-400' : 'text-amber-400')
              }`}>
                {displayInfo.label}: {displayInfo.current}
                {!displayInfo.isUnlimited && `/${displayInfo.total}`}
              </span>
            </div>
            
            {!user?.isPremium && (
              <Button
                size="sm"
                onClick={() => setShowPayment(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-xs"
              >
                Upgrade Pro
              </Button>
            )}
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings className="text-slate-400 w-4 h-4" />
              </Button>
              
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="text-white text-sm" />
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings} 
        user={user}
      />
      
      <PaymentModal 
        open={showPayment} 
        onOpenChange={setShowPayment} 
      />
    </>
  );
}
