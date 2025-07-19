import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import ChatHistory from "@/components/chat/ChatHistory";
import AIActivityFeed from "@/components/chat/AIActivityFeed";
import ChatInterface from "@/components/chat/ChatInterface";
import PaymentModal from "@/components/modals/PaymentModal";
import GrantWritingPanel from "@/components/grant-writing/GrantWritingPanel";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Search } from "lucide-react";
import type { Conversation, Message, AIActivity, WebSocketMessage } from "@/types";

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [aiActivities, setAiActivities] = useState<AIActivity[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<'manus' | 'grant' | 'seo' | 'replit'>('manus');
  
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    onError: (error) => {
      console.error('Error fetching conversations:', error);
    }
  });

  // Fetch messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedConversation?.id, 'messages'],
    enabled: !!selectedConversation?.id,
    onError: (error) => {
      console.error('Error fetching messages:', error);
    }
  });

  // Fetch AI activities for the selected conversation
  const { data: activities = [] } = useQuery<AIActivity[]>({
    queryKey: ['/api/ai-activities', selectedConversation?.id],
    enabled: !!selectedConversation?.id,
    refetchInterval: 2000, // Refresh every 2 seconds
    onError: (error) => {
      console.error('Error fetching AI activities:', error);
    }
  });

  // Set up WebSocket connection
  useEffect(() => {
    if (!selectedConversation?.id) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        // Subscribe to conversation activities
        newSocket.send(JSON.stringify({
          type: 'subscribe',
          conversationId: selectedConversation.id
        }));
      };

      newSocket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'ai_activity') {
            const activity = data.data || data.activity;
            console.log('Received AI activity:', activity);
            setAiActivities(prev => {
              const existing = prev.find(a => a.id === activity.id);
              if (existing) {
                return prev.map(a => a.id === activity.id ? activity : a);
              } else {
                return [...prev, activity];
              }
            });
          } else if (data.type === 'typing_start') {
            setIsTyping(true);
          } else if (data.type === 'typing_stop' || data.type === 'response_complete') {
            setIsTyping(false);
            refetchMessages();
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }, [selectedConversation?.id, refetchMessages]);

  const handleConversationCreated = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    refetchConversations();
  };

  const handleNewConversation = () => {
    // Clear all conversation-related state
    setSelectedConversation(null);
    setAiActivities([]);
    setIsTyping(false);
    
    // Clear cached messages for all conversations to ensure clean state
    queryClient.removeQueries({ 
      queryKey: ['/api/conversations'], 
      predicate: (query) => query.queryKey.includes('messages')
    });
    
    // Clear AI activities cache
    queryClient.removeQueries({ 
      queryKey: ['/api/ai-activities']
    });
    
    // Close any existing WebSocket connection
    if (socket) {
      socket.close();
      setSocket(null);
    }
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

  // Handle different chat modes with appropriate context
  const getMessageContext = () => {
    switch (chatMode) {
      case 'manus':
        return 'manus_pro';
      case 'grant':
        return 'grant_writing';
      case 'seo':
        return 'seo_content';
      case 'replit':
        return 'replit_pro';
      default:
        return 'manus_pro';
    }
  };

  // Get messages for display - return empty array if no conversation is selected
  const displayMessages = selectedConversation ? messages : [];

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Header />
      
      {/* Mode Toggle */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center space-x-2 mb-3">
          <Button
            variant={chatMode === 'manus' ? "default" : "outline"}
            size="sm"
            onClick={() => setChatMode('manus')}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Manus Pro</span>
          </Button>
          <Button
            variant={chatMode === 'grant' ? "default" : "outline"}
            size="sm"
            onClick={() => setChatMode('grant')}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
          >
            <FileText className="w-4 h-4" />
            <span>Professional Grant Writing</span>
          </Button>
          <Button
            variant={chatMode === 'seo' ? "default" : "outline"}
            size="sm"
            onClick={() => setChatMode('seo')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Search className="w-4 h-4" />
            <span>General + SEO Assistance</span>
          </Button>
          <Button
            variant={chatMode === 'replit' ? "default" : "outline"}
            size="sm"
            onClick={() => setChatMode('replit')}
            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
          >
            <FileText className="w-4 h-4" />
            <span>Replit Pro</span>
          </Button>
        </div>
        
        {/* Mode Descriptions */}
        <div className="text-sm text-slate-300 px-2">
          {chatMode === 'manus' && (
            <div className="bg-slate-700 rounded-lg p-3 border-l-4 border-emerald-500">
              <div className="font-semibold text-emerald-400 mb-1">🧠 Manus Pro - Universal AI Assistant</div>
              <p>The most comprehensive AI assistant available. Handles everything like Manus AI: programming, mathematics, science, business strategy, technical support, and creative projects. Unlike ChatGPT or Claude alone, this combines multiple AI models for superior accuracy and depth across all domains.</p>
            </div>
          )}
          
          {chatMode === 'grant' && (
            <div className="bg-slate-700 rounded-lg p-3 border-l-4 border-purple-500">
              <div className="font-semibold text-purple-400 mb-1">📝 Professional Grant Writing - Industry Expert</div>
              <p>The only AI platform specifically trained for professional grant writing. Delivers submission-ready proposals for NIH, NSF, DOE, DARPA, and foundation grants. No other platform offers this level of specialized grant expertise with real agency knowledge and compliance requirements.</p>
            </div>
          )}
          
          {chatMode === 'seo' && (
            <div className="bg-slate-700 rounded-lg p-3 border-l-4 border-blue-500">
              <div className="font-semibold text-blue-400 mb-1">🚀 General + SEO Assistance - Content Strategist</div>
              <p>Advanced content marketing and SEO optimization that goes beyond basic AI writing tools. Combines real-time competitive analysis, keyword research, and strategic content planning. More comprehensive than Jasper, Copy.ai, or other content tools by integrating live market data.</p>
            </div>
          )}
          
          {chatMode === 'replit' && (
            <div className="bg-slate-700 rounded-lg p-3 border-l-4 border-orange-500">
              <div className="font-semibold text-orange-400 mb-1">⚡ Replit Pro - Elite Development Assistant</div>
              <p>The most advanced programming AI available. Generates production-ready code in any language with full-stack architecture, DevOps, and deployment guidance. Superior to GitHub Copilot or Cursor by providing complete project solutions, not just code snippets.</p>
            </div>
          )}
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
            messages={displayMessages}
            onConversationCreated={handleConversationCreated}
            onMessageSent={handleMessageSent}
            isTyping={isTyping}
            chatMode={chatMode}
          />
        </div>

        {/* Right Sidebar - AI Brain Activity or Grant Writing */}
        <div className="w-1/4 bg-slate-800 border-l border-slate-700 flex flex-col">
          {chatMode === 'grant' ? (
            <GrantWritingPanel 
              isVisible={chatMode === 'grant'}
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
                    <span className="text-xs text-slate-400">Groq AI</span>
                    <span className="text-xs text-emerald-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">PayPal</span>
                    <span className="text-xs text-blue-400">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Google Drive</span>
                    <span className="text-xs text-emerald-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Memory System</span>
                    <span className="text-xs text-emerald-400">Active</span>
                  </div>
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

