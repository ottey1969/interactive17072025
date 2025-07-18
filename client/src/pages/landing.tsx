import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Brain, Search, TrendingUp, Shield, Zap, Users, Sparkles, ArrowRight, CheckCircle, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, logoutMutation } = useAuth();
  const [gradientOn, setGradientOn] = useState(true);
  const [animatedBg, setAnimatedBg] = useState(true);
  
  const isAuthenticated = !!user;

  const handleLogin = () => {
    setLocation('/auth');
  };

  const handleStartWriting = () => {
    if (isAuthenticated) {
      setLocation('/home');
    } else {
      setLocation('/auth');
    }
  };

  // Removed demo functionality - users go directly to platform after login

  const callProtectedApi = async () => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    
    toast({
      title: "Premium Features",
      description: "Welcome to Sofeia AI premium features!",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      gradientOn 
        ? 'bg-gradient-to-br from-slate-900 via-indigo-950/30 to-purple-950/20' 
        : 'bg-slate-900'
    } transition-all duration-1000`}>
      
      {/* Animated Background Elements */}
      {animatedBg && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
      )}
      {/* Header */}
      <header className="relative border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-md z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${gradientOn ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-indigo-600'} rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110`}>
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">ContentScale</h1>
                <p className="text-xs text-slate-400">Powered by Sofeia AI</p>
              </div>
            </div>
            
            {/* Interactive Controls */}
            <div className="hidden md:flex items-center gap-4 mr-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Gradients</span>
                <Switch checked={gradientOn} onCheckedChange={setGradientOn} />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Animation</span>
                <Switch checked={animatedBg} onCheckedChange={setAnimatedBg} />
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isAuthenticated ? (
                <Button 
                  onClick={handleLogin}
                  className={`${gradientOn ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} transition-all duration-300 hover:scale-105`}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Creating
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-slate-300">
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                      Welcome, {user?.firstName || user?.email?.split('@')[0]}!
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => setLocation('/home')}
                    className={`${gradientOn ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} transition-all duration-300`}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Platform
                  </Button>
                  <Button 
                    onClick={() => logoutMutation.mutate()}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 transition-all duration-300"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 py-20 z-10">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className={`mb-6 ${gradientOn ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/30' : 'bg-indigo-500/20 border-indigo-500/30'} text-indigo-400 transition-all duration-300 hover:scale-105`}>
            <Brain className="w-4 h-4 mr-2" />
            Advanced AI Content Platform
          </Badge>
          
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 transition-all duration-1000 ${
            gradientOn 
              ? 'bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent'
          }`}>
            Scale Content Production
            <span className="block mt-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              10x Faster
            </span>
          </h1>
          
          <h2 className={`text-2xl md:text-3xl font-semibold mb-6 transition-all duration-500 ${
            gradientOn ? 'text-indigo-200' : 'text-slate-300'
          }`}>
            Professional AI Content Writing Platform | ContentScale AI
          </h2>
          
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your content strategy with <strong className="text-indigo-400">advanced AI-powered writing</strong>, 
            real-time competitor research, <strong className="text-purple-400">bulk content creation</strong>, 
            and automated SEO optimization. The ultimate content scaling platform for modern businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleStartWriting}
                  className={`group ${gradientOn ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-lg px-8 py-4 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl`}
                >
                  <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Start Creating Content
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleLogin}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-indigo-500/50 text-lg px-8 py-4 transition-all duration-300 backdrop-blur-sm"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Try Free Version
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => setLocation('/home')}
                  className={`group ${gradientOn ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-lg px-8 py-4 transition-all duration-300 hover:scale-105`}
                >
                  <Brain className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Scale Content Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={callProtectedApi}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-emerald-500/50 text-lg px-8 py-4 transition-all duration-300 backdrop-blur-sm"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Premium Features
                </Button>
              </>
            )}
          </div>
          
          {/* Content Scale Keywords Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-sm text-slate-400">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="font-semibold text-indigo-400">Content Scale</div>
              <div>10x Production</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="font-semibold text-indigo-400">Bulk Creation</div>
              <div>Mass Production</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="font-semibold text-indigo-400">AI Writing</div>
              <div>Automated Content</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="font-semibold text-indigo-400">SEO Optimization</div>
              <div>Scale Strategy</div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <p className="text-sm text-slate-500">
                <strong>For Subscribers:</strong> Real login is now available! Admin users get unlimited access.
              </p>

            </div>
          </div>

          {/* Interactive AI Thinking Visualization */}
          <div className={`relative max-w-3xl mx-auto ${gradientOn ? 'bg-gradient-to-br from-slate-800/60 to-indigo-900/30' : 'bg-slate-800/50'} rounded-2xl p-8 border ${gradientOn ? 'border-indigo-500/30' : 'border-slate-700'} transition-all duration-300 hover:scale-[1.02] group cursor-pointer backdrop-blur-sm shadow-2xl`}
               onClick={() => {
                 toast({
                   title: "✨ Sofeia AI Demo",
                   description: "Experience real-time AI thinking process in the full platform!",
                   duration: 3000,
                 });
               }}>
            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-10 h-10 ${gradientOn ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-indigo-600'} rounded-lg flex items-center justify-center transition-all duration-300 group-hover:rotate-12`}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Sofeia AI Live Processing...</h3>
              <div className="flex space-x-1 ml-auto">
                <div className={`w-3 h-3 ${gradientOn ? 'bg-indigo-400' : 'bg-indigo-500'} rounded-full animate-pulse`}></div>
                <div className={`w-3 h-3 ${gradientOn ? 'bg-purple-400' : 'bg-indigo-500'} rounded-full animate-pulse`} style={{animationDelay: '0.2s'}}></div>
                <div className={`w-3 h-3 ${gradientOn ? 'bg-cyan-400' : 'bg-indigo-500'} rounded-full animate-pulse`} style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">✓ Researched 47 competitors in 2.3 seconds</span>
                <Badge className="bg-green-500/20 text-green-400 text-xs">Complete</Badge>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300">🔍 Analyzing 1,247 keyword opportunities...</span>
                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Processing</Badge>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-spin"></div>
                <span className="text-slate-300">⚡ Generating SEO-optimized content structure...</span>
                <Badge className="bg-blue-500/20 text-blue-400 text-xs">In Progress</Badge>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-4 h-4 bg-slate-600 rounded-full"></div>
                <span className="text-slate-400">📊 Preparing competitive analysis report...</span>
                <Badge className="bg-slate-500/20 text-slate-400 text-xs">Queued</Badge>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700/50 text-center">
              <p className="text-sm text-slate-400">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Click to experience the full AI thinking process
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Scale Content Production Like Never Before
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            ContentScale AI transforms how you create, optimize, and scale content production with advanced AI capabilities for bulk content creation and automated content marketing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className={`${gradientOn ? 'bg-gradient-to-br from-slate-800/60 to-blue-900/30 border-blue-500/30' : 'bg-slate-800/50 border-slate-700'} transition-all duration-300 hover:scale-105 group cursor-pointer`}>
            <CardHeader>
              <div className={`w-12 h-12 ${gradientOn ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20' : 'bg-blue-500/20'} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Real-time Research</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Watch Sofeia AI research competitors, analyze SERPs, and find keyword opportunities in real-time with Perplexity integration.
              </p>
            </CardContent>
          </Card>

          <Card className={`${gradientOn ? 'bg-gradient-to-br from-slate-800/60 to-purple-900/30 border-purple-500/30' : 'bg-slate-800/50 border-slate-700'} transition-all duration-300 hover:scale-105 group cursor-pointer`}>
            <CardHeader>
              <div className={`w-12 h-12 ${gradientOn ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/20' : 'bg-purple-500/20'} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Brain className="w-6 h-6 text-purple-400 group-hover:animate-pulse" />
              </div>
              <CardTitle className="text-white">AI Brain Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Unique real-time visualization of AI thinking process - see exactly how Sofeia analyzes and strategizes your content.
              </p>
            </CardContent>
          </Card>

          <Card className={`${gradientOn ? 'bg-gradient-to-br from-slate-800/60 to-emerald-900/30 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'} transition-all duration-300 hover:scale-105 group cursor-pointer`}>
            <CardHeader>
              <div className={`w-12 h-12 ${gradientOn ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20' : 'bg-emerald-500/20'} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <TrendingUp className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
              <CardTitle className="text-white">SEO Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                C.R.A.F.T framework implementation with Google AI Overview optimization for maximum search visibility.
              </p>
            </CardContent>
          </Card>

          <Card className={`${gradientOn ? 'bg-gradient-to-br from-slate-800/60 to-orange-900/30 border-orange-500/30' : 'bg-slate-800/50 border-slate-700'} transition-all duration-300 hover:scale-105 group cursor-pointer`}>
            <CardHeader>
              <div className={`w-12 h-12 ${gradientOn ? 'bg-gradient-to-br from-orange-500/30 to-red-500/20' : 'bg-orange-500/20'} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Zap className="w-6 h-6 text-orange-400 group-hover:animate-bounce" />
              </div>
              <CardTitle className="text-white">Instant Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Generate high-quality, SEO-optimized content instantly with Claude-4 Sonnet integration and advanced prompting.
              </p>
            </CardContent>
          </Card>

          <Card className={`${gradientOn ? 'bg-gradient-to-br from-slate-800/60 to-cyan-900/30 border-cyan-500/30' : 'bg-slate-800/50 border-slate-700'} transition-all duration-300 hover:scale-105 group cursor-pointer`}>
            <CardHeader>
              <div className={`w-12 h-12 ${gradientOn ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20' : 'bg-cyan-500/20'} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Users className="w-6 h-6 text-cyan-400 group-hover:animate-pulse" />
              </div>
              <CardTitle className="text-white">Competitor Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Deep competitive intelligence with gap analysis and actionable recommendations to outrank competitors.
              </p>
            </CardContent>
          </Card>

          <Card className={`${gradientOn ? 'bg-gradient-to-br from-slate-800/60 to-green-900/30 border-green-500/30' : 'bg-slate-800/50 border-slate-700'} transition-all duration-300 hover:scale-105 group cursor-pointer`}>
            <CardHeader>
              <div className={`w-12 h-12 ${gradientOn ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20' : 'bg-green-500/20'} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Shield className="w-6 h-6 text-green-400 group-hover:rotate-12 transition-transform" />
              </div>
              <CardTitle className="text-white">GDPR Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Fully GDPR compliant with transparent data handling and user privacy protection built-in from day one.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Start free with 3 questions per day, upgrade for unlimited access
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className={`${gradientOn ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/40 border-slate-600/50' : 'bg-slate-800/50 border-slate-700'} transition-all duration-300 hover:scale-105 group`}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                Free Plan
              </CardTitle>
              <div className="text-3xl font-bold text-slate-300 mt-4">$0<span className="text-lg text-slate-400">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">3 questions per day</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Basic AI responses</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Real-time AI visualization</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">WhatsApp support</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${gradientOn ? 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500/30'} relative transition-all duration-300 hover:scale-105 group`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className={`${gradientOn ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-indigo-600'} text-white animate-pulse`}>
                <Sparkles className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                <Brain className="w-6 h-6 text-indigo-400" />
                Pro Plan
              </CardTitle>
              <div className="text-3xl font-bold text-white mt-4">$35<span className="text-lg text-slate-400">/month</span></div>
              <p className="text-xs text-indigo-200">Contact WhatsApp for unlimited access</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">150 questions per month</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Advanced AI analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Priority processing</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Export capabilities</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-300">Advanced SEO tools</span>
              </div>
              <div className="flex items-center space-x-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-300">WhatsApp for unlimited</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button 
            size="lg" 
            onClick={handleStartWriting}
            className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-3"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">ContentScale</h3>
                  <p className="text-xs text-slate-400">Powered by Sofeia AI</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Founded by Ottmar Joseph Gregory Francisca. Advanced AI content platform for the modern digital age.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <div className="space-y-2 text-sm">
                <button onClick={() => window.location.hash = '#features'} className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer text-left">Features</button>
                <button onClick={() => window.location.hash = '#pricing'} className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer text-left">Pricing</button>
                <button onClick={() => setLocation('/home')} className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer text-left">Platform Access</button>
                <a href="https://github.com/ottey1969/SofeiaInteractive" target="_blank" rel="noopener noreferrer" className="flex items-center text-slate-400 hover:text-indigo-400 transition-colors">
                  Documentation <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <a href="https://wa.me/31628073996" target="_blank" rel="noopener noreferrer" className="flex items-center text-slate-400 hover:text-indigo-400 transition-colors">
                  WhatsApp Support <ExternalLink className="w-3 h-3 ml-1" />
                </a>
                <a href="mailto:ottmar.francisca1969@gmail.com" className="flex items-center text-slate-400 hover:text-indigo-400 transition-colors">
                  Help Center <ExternalLink className="w-3 h-3 ml-1" />
                </a>
                <a href="https://discord.gg/contentscale" target="_blank" rel="noopener noreferrer" className="flex items-center text-slate-400 hover:text-indigo-400 transition-colors">
                  Community <ExternalLink className="w-3 h-3 ml-1" />
                </a>
                <button onClick={() => {
                  toast({
                    title: "System Status",
                    description: "All systems operational ✅",
                    duration: 2000,
                  });
                }} className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer text-left">Status</button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <button onClick={() => {
                  toast({
                    title: "Privacy Policy",
                    description: "GDPR compliant privacy protection for all users",
                    duration: 2000,
                  });
                }} className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer text-left">Privacy Policy</button>
                <button onClick={() => {
                  toast({
                    title: "Terms of Service", 
                    description: "Fair and transparent terms for ContentScale AI",
                    duration: 2000,
                  });
                }} className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer text-left">Terms of Service</button>
                <button onClick={() => {
                  toast({
                    title: "GDPR Compliance",
                    description: "Full GDPR compliance with transparent data handling",
                    duration: 2000,
                  });
                }} className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer text-left">GDPR Compliance</button>
                <button onClick={() => {
                  toast({
                    title: "Cookie Policy",
                    description: "Minimal cookies for essential functionality only",
                    duration: 2000,
                  });
                }} className="block text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer text-left">Cookie Policy</button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-400 text-sm">
                © 2025 ContentScale AI. All rights reserved. Founded by Ottmar Joseph Gregory Francisca.
              </p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  GDPR Compliant
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  <Shield className="w-3 h-3 mr-1" />
                  Secure Platform
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}