import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Brain, Zap, Image, X, File } from "lucide-react";

interface GrantWritingPanelProps {
  isVisible: boolean;
  onSendGrantMessage: (message: string, context?: any) => void;
}

interface UploadedFile {
  id: number;
  name: string;
  type: 'text' | 'image';
  content: string;
  size: number;
  uploadDate: string;
  preview?: string;
}

export default function GrantWritingPanel({ isVisible, onSendGrantMessage }: GrantWritingPanelProps) {
  const [largeContent, setLargeContent] = useState("");
  const [grantMessage, setGrantMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState("documents");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isVisible) return null;

  const handleProcessLargeContent = () => {
    if (!largeContent.trim()) return;
    
    const sizeKB = Math.ceil(new TextEncoder().encode(largeContent).length / 1024);
    
    const newDoc: UploadedFile = {
      id: Date.now(),
      name: `Document ${uploadedFiles.filter(f => f.type === 'text').length + 1}`,
      type: 'text',
      content: largeContent,
      size: sizeKB,
      uploadDate: new Date().toISOString()
    };
    
    setUploadedFiles(prev => [...prev, newDoc]);
    setLargeContent("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile: UploadedFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: 'text',
          content: content,
          size: Math.ceil(file.size / 1024),
          uploadDate: new Date().toISOString()
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsText(file);
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile: UploadedFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: 'image',
          content: content,
          size: Math.ceil(file.size / 1024),
          uploadDate: new Date().toISOString(),
          preview: content
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: number) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleSendGrantRequest = () => {
    if (!grantMessage.trim()) return;
    
    const context = {
      type: 'grant_writing',
      documents: uploadedFiles.filter(f => f.type === 'text'),
      images: uploadedFiles.filter(f => f.type === 'image'),
      enhancedPrompt: true
    };
    
    onSendGrantMessage(grantMessage, context);
    setGrantMessage("");
  };

  const textFiles = uploadedFiles.filter(f => f.type === 'text');
  const imageFiles = uploadedFiles.filter(f => f.type === 'image');

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
          {/* File Upload Tabs */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Reference Materials</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upload documents and images to enhance your grant proposal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger value="documents" className="data-[state=active]:bg-slate-600">
                    <File className="w-4 h-4 mr-2" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="images" className="data-[state=active]:bg-slate-600">
                    <Image className="w-4 h-4 mr-2" />
                    Images
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="documents" className="space-y-4">
                  {/* Text Content Input */}
                  <div className="space-y-3">
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
                        Add Content
                      </Button>
                    </div>
                  </div>
                  
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".txt,.doc,.docx,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                    <p className="text-xs text-slate-500 mt-2">
                      Supports TXT, DOC, DOCX, PDF files
                    </p>
                  </div>

                  {/* Text Files List */}
                  {textFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-300">Uploaded Documents ({textFiles.length})</h4>
                      {textFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <File className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="text-white text-sm font-medium">{file.name}</p>
                              <p className="text-slate-400 text-xs">{file.size} KB</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400">
                              Processed
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(file.id)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="images" className="space-y-4">
                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center">
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => imageInputRef.current?.click()}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                    <p className="text-xs text-slate-500 mt-2">
                      Supports JPG, PNG, GIF, WebP images
                    </p>
                  </div>

                  {/* Images Grid */}
                  {imageFiles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-300">Uploaded Images ({imageFiles.length})</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {imageFiles.map((file) => (
                          <div key={file.id} className="relative group">
                            <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(file.id)}
                              className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500/80 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <div className="mt-1">
                              <p className="text-xs text-slate-300 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{file.size} KB</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

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
                  <p className="text-slate-300 text-xs">Analyzes your documents and images for perfect alignment</p>
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
              {(textFiles.length > 0 || imageFiles.length > 0) && (
                <p className="text-xs text-slate-400 text-center">
                  Using {textFiles.length} document{textFiles.length !== 1 ? 's' : ''} and {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} as reference
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

