import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Brain, Zap } from "lucide-react";

interface GrantWritingPanelProps {
  isVisible: boolean;
  onSendGrantMessage: (message: string, context?: any) => void;
}

export default function GrantWritingPanel({ isVisible, onSendGrantMessage }: GrantWritingPanelProps) {
  const [largeContent, setLargeContent] = useState("");
  const [grantMessage, setGrantMessage] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  if (!isVisible) return null;

  const handleProcessLargeContent = () => {
    if (!largeContent.trim()) return;
    
    // Calculate content size
    const sizeKB = Math.ceil(new TextEncoder().encode(largeContent).length / 1024);
    
    const newDoc = {
      id: Date.now(),
      title: `Document ${uploadedDocs.length + 1}`,
      content: largeContent,
      sizeKB,
      uploadDate: new Date().toISOString()
    };
    
    setUploadedDocs(prev => [...prev, newDoc]);
    setLargeContent("");
  };

  const handleSendGrantRequest = () => {
    if (!grantMessage.trim()) return;
    
    const context = {
      type: 'grant_writing',
      documents: uploadedDocs,
      enhancedPrompt: true
    };
    
    onSendGrantMessage(grantMessage, context);
    setGrantMessage("");
  };

  return (
    <div className="h-full bg-slate-900 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-b border-purple-500/30 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <FileText className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Professional Grant Writing</h2>
            <p className="text-slate-300 text-sm">AI trained for world-class grant proposals</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Large Content Processing */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Large Content Processing</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upload large documents, research papers, or reference materials for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={largeContent}
                onChange={(e) => setLargeContent(e.target.value)}
                placeholder="Paste large content here (Google Drive docs, research papers, funding guidelines, etc.)..."
                className="bg-slate-900 border-slate-600 text-white min-h-[120px] resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {largeContent ? `${Math.ceil(new TextEncoder().encode(largeContent).length / 1024)} KB` : '0 KB'}
                </span>
                <Button 
                  onClick={handleProcessLargeContent}
                  disabled={!largeContent.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Process Content
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Documents */}
          {uploadedDocs.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-indigo-400 text-sm">Reference Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <div>
                        <p className="text-white text-sm font-medium">{doc.title}</p>
                        <p className="text-slate-400 text-xs">{doc.sizeKB} KB</p>
                      </div>
                      <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400">
                        Processed
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grant Writing Features */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-emerald-400 flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>AI Grant Writing Training</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Advanced AI trained on professional grant writing best practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-slate-900 rounded-lg">
                  <h4 className="text-emerald-400 font-medium text-sm">Expert Training</h4>
                  <p className="text-slate-300 text-xs">Trained on successful federal, state, and foundation grants</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg">
                  <h4 className="text-emerald-400 font-medium text-sm">Professional Structure</h4>
                  <p className="text-slate-300 text-xs">Follows NIH, NSF, and foundation writing standards</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg">
                  <h4 className="text-emerald-400 font-medium text-sm">Context Awareness</h4>
                  <p className="text-slate-300 text-xs">Analyzes your documents for perfect alignment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grant Writing Input */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Grant Writing Request</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={grantMessage}
                onChange={(e) => setGrantMessage(e.target.value)}
                placeholder="Describe your grant writing needs... e.g., 'Write a specific aims section for an NIH R01 proposal on cancer research' or 'Create a budget justification for education funding'"
                className="bg-slate-900 border-slate-600 text-white min-h-[100px] resize-none"
              />
              <Button 
                onClick={handleSendGrantRequest}
                disabled={!grantMessage.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Generate Professional Grant Content
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}