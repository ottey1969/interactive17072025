import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Brain, User, Shield, FileText, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { responseHandler, type MessageType } from "@/utils/ResponseHandler";
import type { Conversation, Message } from "@/types";
import MessageDisplay from './MessageDisplay';

interface ChatInterfaceProps {
  conversation: Conversation | null;
  messages: Message[];
  onConversationCreated: (conversation: Conversation) => void;
  onMessageSent: (userMessage?: string) => void;
  isTyping?: boolean;
  chatMode?: 'general' | 'grant' | 'seo';
}

export default function ChatInterface({
  conversation,
  messages,
  onConversationCreated,
  onMessageSent,
  isTyping = false,
  chatMode = 'general'
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [localIsTyping, setLocalIsTyping] = useState(false);
  
  const displayMessages = messages;
  const showTyping = isTyping || localIsTyping;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/conversations", { title });
      return response.json();
    },
    onSuccess: (newConversation) => {
      onConversationCreated(newConversation);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Send the stored message to the new conversation
      if (message.trim()) {
        const messageType = responseHandler.categorizeMessage(message);
        sendMessageMutation.mutate({
          conversationId: newConversation.id,
          message,
          messageType
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Conversation creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation. Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message, messageType, chatMode }: { conversationId: number; message: string; messageType?: MessageType; chatMode?: string }) => {
      const response = await apiRequest("POST", "/api/chat", { conversationId, message, messageType, chatMode });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.message}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      const sentMessage = message;
      const messageType = responseHandler.categorizeMessage(sentMessage);
      setMessage("");
      setLocalIsTyping(true);
      onMessageSent(sentMessage);
      
      // Show question limit warning if applicable
      if (data.questionsRemaining !== undefined && data.questionsRemaining <= 1) {
        toast({
          title: "Question Limit Warning",
          description: `You have ${data.questionsRemaining} question${data.questionsRemaining === 1 ? '' : 's'} remaining today. Upgrade to Pro for unlimited questions.`,
          variant: "destructive",
        });
      }
      
      // Stop typing indicator based on message type - simple messages get quick responses
      const typingDuration = messageType === 'simple' ? 500 : (messageType === 'complex' ? 15000 : 8000);
      setTimeout(() => setLocalIsTyping(false), typingDuration);
    },
    onError: (error: any) => {
      if (error.message.includes('429')) {
        // Show upgrade modal for question limit
        const upgradeModal = document.querySelector('[data-upgrade-modal]') as HTMLButtonElement;
        if (upgradeModal) {
          upgradeModal.click();
        } else {
          toast({
            title: "Daily Limit Reached",
            description: "You've used all 3 daily questions. Upgrade to Pro for unlimited access!",
            variant: "destructive",
          });
        }
        return;
      }
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      const errorMessage = error.message || "Failed to send message";
      if (errorMessage.includes("Daily question limit reached")) {
        toast({
          title: "Limit Reached",
          description: "You've reached your daily question limit. Upgrade to Pro for unlimited questions.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessageMutation.isPending || createConversationMutation.isPending) return;

    // No demo mode - all users use real authentication
    if (false) {
      // Handle demo mode differently
      onMessageSent(message);
      setMessage("");
      return;
    }

    // Categorize the message using ResponseHandler
    const messageType = responseHandler.categorizeMessage(message);
    console.log(`🔄 Frontend categorized message "${message}" as: ${messageType}`);

    if (!conversation) {
      // Create a new conversation first
      const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
      createConversationMutation.mutate(title);
    } else {
      sendMessageMutation.mutate({
        conversationId: conversation.id,
        message,
        messageType,
        chatMode
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6">
        {displayMessages.length > 0 ? (
          displayMessages.map((msg) => (
            <div key={msg.id} className={`mb-6 ${msg.role === 'user' ? 'flex justify-end' : 'flex items-start space-x-3'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-indigo-600 text-white rounded-2xl px-4 py-3">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 text-right">
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Brain className="text-white text-xs w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <MessageDisplay message={msg} />
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-brain text-3xl text-white"></i>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">Sofeia AI</span>
            </h1>
            
            <p className="text-lg text-slate-300 mb-8">
              The most advanced multi-modal AI platform. Four specialized assistants in one platform.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 rounded-xl p-4 border-l-4 border-emerald-500 text-left">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-md font-semibold text-emerald-400">Manus Pro</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Universal AI assistant that handles everything like Manus AI. Programming, mathematics, science, and business with superior accuracy.
                </p>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 border-l-4 border-purple-500 text-left">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-md font-semibold text-purple-400">Professional Grant Writing</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  The only AI platform specifically trained for professional grant writing. Submission-ready NIH, NSF, and foundation proposals.
                </p>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 border-l-4 border-blue-500 text-left">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-md font-semibold text-blue-400">General + SEO Assistance</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  Advanced content marketing and SEO optimization with real-time competitive analysis and strategic planning.
                </p>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 border-l-4 border-orange-500 text-left">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-md font-semibold text-orange-400">Replit Pro</h3>
                </div>
                <p className="text-slate-300 text-sm">
                  The most advanced programming AI available. Production-ready code with full-stack architecture and deployment guidance.
                </p>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">🏆 Why Sofeia AI Leads the Market</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-indigo-400 font-semibold mb-1">Multi-Model Integration</div>
                  <p className="text-slate-400">Combines Claude Sonnet 4, Groq, and Perplexity for superior accuracy vs single AI models</p>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-semibold mb-1">Specialized Expertise</div>
                  <p className="text-slate-400">Domain-specific training for grant writing and development vs generic AI assistants</p>
                </div>
                <div className="text-center">
                  <div className="text-emerald-400 font-semibold mb-1">Real-Time Intelligence</div>
                  <p className="text-slate-400">Live research integration and competitive analysis vs static knowledge bases</p>
                </div>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">Select a chat mode above and start your first conversation</p>
          </div>
        )}

        {/* AI Typing Indicator */}
        {showTyping && (
          <div className="flex items-start space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="text-white text-xs w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="bg-slate-700 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-slate-300 text-sm">Sofeia is thinking...</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-1">Processing your message</p>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-6 border-t border-slate-700">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Sofeia about content strategy, SEO, or keyword research..." 
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[60px]"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending || createConversationMutation.isPending}
              className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-700 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Demo mode credits display */}
            {false && (
              <div className="text-xs text-yellow-400">
                Questions: {3 - (JSON.parse(localStorage.getItem('demo_questions_used') || '0'))}/3
              </div>
            )}
            {/* Next Question Button - shows after messages exist */}
            {displayMessages.length > 0 && (
              <Button
                onClick={() => setMessage("")}
                variant="outline"
                size="sm"
                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Next Question
              </Button>
            )}
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Shield className="w-3 h-3 text-green-400" />
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
