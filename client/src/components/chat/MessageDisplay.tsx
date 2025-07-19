import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Code } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import MessageActions from './MessageActions';

interface MessageDisplayProps {
  message: {
    id: number;
    role: string;
    content: string;
    createdAt: string;
  };
}

export default function MessageDisplay({ message }: MessageDisplayProps) {
  const isUser = message.role === 'user';
  
  // Enhanced HTML detection - check for any HTML tags
  const isHtml = message.content.includes('<h1>') || 
                 message.content.includes('<h2>') || 
                 message.content.includes('<h3>') || 
                 message.content.includes('<h4>') || 
                 message.content.includes('<h5>') || 
                 message.content.includes('<h6>') || 
                 message.content.includes('<ul>') || 
                 message.content.includes('<ol>') || 
                 message.content.includes('<li>') || 
                 message.content.includes('<p>') || 
                 message.content.includes('<strong>') || 
                 message.content.includes('<em>') || 
                 message.content.includes('<a href') ||
                 message.content.includes('<table>') ||
                 message.content.includes('<div>');

  const formatContent = (content: string) => {
    if (isHtml) {
      // Clean up the HTML content for better display
      let cleanedContent = content
        // Ensure proper spacing around headers
        .replace(/(<\/h[1-6]>)/g, '$1\n')
        .replace(/(<h[1-6][^>]*>)/g, '\n$1')
        // Ensure proper spacing around lists
        .replace(/(<\/ul>|<\/ol>)/g, '$1\n')
        .replace(/(<ul>|<ol>)/g, '\n$1')
        // Ensure proper spacing around paragraphs
        .replace(/(<\/p>)/g, '$1\n')
        .replace(/(<p[^>]*>)/g, '\n$1')
        // Clean up multiple newlines
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
      
      return { __html: cleanedContent };
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`group ${isUser ? 'max-w-xs lg:max-w-md' : 'flex-1'}`}>
      {isUser ? (
        <div>
          <div className="bg-indigo-600 text-white rounded-2xl px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-slate-400 text-xs mt-1 text-right">
            {formatTime(message.createdAt)}
          </p>
        </div>
      ) : (
        <div>
          <div className="bg-slate-700 rounded-2xl px-4 py-3">
            {isHtml ? (
              <div 
                className="prose prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={formatContent(message.content)}
                style={{
                  '--tw-prose-headings': '#ffffff',
                  '--tw-prose-body': '#e2e8f0',
                  '--tw-prose-bold': '#ffffff',
                  '--tw-prose-bullets': '#94a3b8',
                  '--tw-prose-counters': '#94a3b8',
                  '--tw-prose-links': '#60a5fa',
                  '--tw-prose-code': '#fbbf24',
                  '--tw-prose-pre-code': '#e2e8f0',
                  '--tw-prose-pre-bg': '#1e293b',
                  '--tw-prose-th-borders': '#475569',
                  '--tw-prose-td-borders': '#334155',
                } as React.CSSProperties}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap text-slate-200">{message.content}</p>
            )}
            
            {!isUser && (
              <MessageActions content={message.content} isHtml={isHtml} />
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {formatTime(message.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
}

