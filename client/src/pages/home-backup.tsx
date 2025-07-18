import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import ChatHistory from "@/components/chat/ChatHistory";
import AIActivityFeed from "@/components/chat/AIActivityFeed";
import ChatInterface from "@/components/chat/ChatInterface";
import PaymentModal from "@/components/modals/PaymentModal";
import GrantWritingPanel from "@/components/grant-writing/GrantWritingPanel";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";
import type { Conversation, Message, AIActivity, WebSocketMessage } from "@/types";

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [aiActivities, setAiActivities] = useState<AIActivity[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showGrantWriting, setShowGrantWriting] = useState(false);
  
  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  // Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ["/api/conversations"],
  });

  // Fetch messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation,
  });

  // Fetch AI activities for selected conversation
  const { data: activities = [], refetch: refetchActivities } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "activities"],
    enabled: !!selectedConversation,
  });

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      if (selectedConversation) {
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'join_conversation',
              conversationId: selectedConversation.id,
              userId: 'current_user'
            }));
          }
        }, 100);
      }
    };

    ws.onmessage = (event) => {
      try {
        console.log('WebSocket message received:', event.data);
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'ai_activity') {
          console.log('Adding AI activity:', message.data);
          setAiActivities(prev => [...prev, message.data]);
          refetchActivities();
        } else if (message.type === 'response_complete') {
          console.log('Response complete received:', message);
          refetchMessages();
          refetchActivities();
          setIsTyping(false);
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [selectedConversation, refetchActivities, refetchMessages]);

  // Update WebSocket when conversation changes
  useEffect(() => {
    if (socket && selectedConversation && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join_conversation',
        conversationId: selectedConversation.id,
        userId: 'current_user'
      }));
    }
  }, [socket, selectedConversation]);

  const handleNewConversation = async () => {
    setSelectedConversation(null);
    setAiActivities([]);
    setIsTyping(false);
    
    // Reset context on backend
    try {
      await fetch('/api/reset-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: selectedConversation?.id })
      });
    } catch (error) {
      console.error('Error resetting context:', error);
    }
  };

  const handleConversationCreated = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    refetchConversations();
    setAiActivities([]);
    setIsTyping(false);
  };

  const handleMessageSent = (userMessage: string) => {
    refetchMessages();
  };

  const handleGrantMessage = async (message: string, context?: any) => {
    if (!selectedConversation) {
      // Create a new conversation for grant writing
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Grant Writing Project' })
        });
        
        if (response.ok) {
          const newConversation = await response.json();
          setSelectedConversation(newConversation);
          refetchConversations();
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
    
    // Send enhanced grant writing message
    if (context?.type === 'grant_writing') {
      // Use enhanced grant writing endpoint
      try {
        await fetch('/api/chat/grant-enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: selectedConversation?.id,
            message: message,
            documentIds: context.documents?.map((d: any) => d.id) || []
          })
        });
        setIsTyping(true);
        refetchMessages();
      } catch (error) {
        console.error('Error sending grant message:', error);
      }
    } else {
      handleMessageSent(message);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Header />
      
      {/* Mode Toggle */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Button
            variant={!showGrantWriting ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrantWriting(false)}
            className="flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>General Chat</span>
          </Button>
          <Button
            variant={showGrantWriting ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrantWriting(true)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
          >
            <FileText className="w-4 h-4" />
            <span>Professional Grant Writing</span>
          </Button>
          <div className="ml-auto text-xs text-slate-400">
            {showGrantWriting ? 'AI trained for world-class grant proposals' : 'General content and SEO assistance'}
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chat History */}
        <div className="w-1/4 bg-slate-800 border-r border-slate-700 flex flex-col">
          <ChatHistory 
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Middle Column - Chat Interface */}
        <div className="flex-1 flex flex-col">
          <ChatInterface 
            conversation={selectedConversation}
            messages={messages}
            onConversationCreated={handleConversationCreated}
            onMessageSent={handleMessageSent}
            isTyping={isTyping}
          />
        </div>

        {/* Right Sidebar - AI Brain Activity or Grant Writing */}
        <div className="w-1/4 bg-slate-800 border-l border-slate-700 flex flex-col">
          {showGrantWriting ? (
            <GrantWritingPanel 
              isVisible={showGrantWriting}
              onSendGrantMessage={handleGrantMessage}
            />
          ) : (
            <>
          {/* AI Activity Header */}
          <div className="bg-slate-800 border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <i className="fas fa-brain text-white"></i>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Sofeia AI Brain Activity</h2>
                  <p className="text-slate-400 text-sm">Real-time AI thinking and planning</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-4 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="text-emerald-400 text-sm">
                  {activities.some(a => a.status === 'active') ? 'Processing...' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Activity Feed */}
          <div className="flex-1 overflow-y-auto">
            <AIActivityFeed 
              activities={activities} 
              realTimeActivities={aiActivities}
              className="h-full"
            />
          </div>
          
          {/* API Integration Status */}
          <div className="bg-slate-900 border-t border-slate-700 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">API Integrations</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Perplexity AI</span>
                <span className="text-xs text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Anthropic Claude</span>
                <span className="text-xs text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">PayPal</span>
                <span className="text-xs text-blue-400">Connected</span>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}