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
  const isHtml = message.content.includes('<h1>') || message.content.includes('<h2>') || message.content.includes('<h3>') || message.content.includes('<h4>') || message.content.includes('<ul>') || message.content.includes('<ol>');

  const formatContent = (content: string) => {
    if (isHtml) {
      return { __html: content };
    }
    return null;
  };

  return (
    <div className={`group ${isUser ? 'max-w-xs lg:max-w-md' : 'flex-1'}`}>
      {isUser ? (
        <div>
          <div className="bg-indigo-600 text-white rounded-2xl px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-slate-400 text-xs mt-1 text-right">
            {new Date(message.createdAt).toLocaleTimeString()}
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
            {new Date(message.createdAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}