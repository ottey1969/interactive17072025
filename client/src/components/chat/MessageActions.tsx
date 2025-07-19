import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Code, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MessageActionsProps {
  content: string;
  isHtml?: boolean;
}

export default function MessageActions({ content, isHtml = false }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const copyFormattedText = async () => {
    try {
      let textToCopy = content;
      
      if (isHtml) {
        // Convert HTML to well-formatted text for copying
        textToCopy = content
          // Headers
          .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '$1\n' + '='.repeat(50) + '\n\n')
          .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '$1\n' + '-'.repeat(30) + '\n\n')
          .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '$1\n' + '-'.repeat(20) + '\n\n')
          .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '$1\n\n')
          .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '$1\n\n')
          .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '$1\n\n')
          // Lists
          .replace(/<ul[^>]*>/gi, '\n')
          .replace(/<\/ul>/gi, '\n')
          .replace(/<ol[^>]*>/gi, '\n')
          .replace(/<\/ol>/gi, '\n')
          .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
          // Paragraphs
          .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
          // Line breaks
          .replace(/<br\s*\/?>/gi, '\n')
          // Text formatting
          .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
          .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
          .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
          .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
          // Links
          .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
          // Tables - basic conversion
          .replace(/<table[^>]*>/gi, '\n')
          .replace(/<\/table>/gi, '\n')
          .replace(/<tr[^>]*>/gi, '')
          .replace(/<\/tr>/gi, '\n')
          .replace(/<th[^>]*>(.*?)<\/th>/gi, '$1\t')
          .replace(/<td[^>]*>(.*?)<\/td>/gi, '$1\t')
          // Remove remaining HTML tags
          .replace(/<[^>]*>/g, '')
          // Clean up whitespace
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .replace(/\t+/g, '\t')
          .trim();
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied with proper formatting for documents",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const copyAsHtml = async () => {
    try {
      // Clean up HTML for better copy-paste compatibility
      let cleanHtml = content
        // Ensure proper spacing and formatting
        .replace(/(<h[1-6][^>]*>)/gi, '\n$1')
        .replace(/(<\/h[1-6]>)/gi, '$1\n')
        .replace(/(<p[^>]*>)/gi, '\n$1')
        .replace(/(<\/p>)/gi, '$1\n')
        .replace(/(<ul[^>]*>|<ol[^>]*>)/gi, '\n$1\n')
        .replace(/(<\/ul>|<\/ol>)/gi, '\n$1\n')
        .replace(/(<li[^>]*>)/gi, '  $1')
        .replace(/(<\/li>)/gi, '$1\n')
        // Clean up multiple newlines
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();

      await navigator.clipboard.writeText(cleanHtml);
      setCopiedHtml(true);
      toast({
        title: "HTML copied",
        description: "Raw HTML has been copied to clipboard - ready for web editors",
      });
      
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (error) {
      console.error('Failed to copy HTML:', error);
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const copyForDocuments = async () => {
    try {
      // Create rich text format for better document compatibility
      let documentText = content;
      
      if (isHtml) {
        // Convert to a format that works well in Word/Google Docs
        documentText = content
          .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '$1\n\n')
          .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '$1\n\n')
          .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '$1\n\n')
          .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '$1\n\n')
          .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
          .replace(/<ul[^>]*>/gi, '\n')
          .replace(/<\/ul>/gi, '\n')
          .replace(/<ol[^>]*>/gi, '\n')
          .replace(/<\/ol>/gi, '\n')
          .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
          .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
          .replace(/<b[^>]*>(.*?)<\/b>/gi, '$1')
          .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')
          .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1')
          .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .trim();
      }
      
      await navigator.clipboard.writeText(documentText);
      toast({
        title: "Document format copied",
        description: "Content formatted for Word/Google Docs - paste directly",
      });
    } catch (error) {
      console.error('Failed to copy for documents:', error);
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        size="sm"
        variant="ghost"
        onClick={copyFormattedText}
        className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-600"
      >
        {copied ? (
          <Check className="h-3 w-3 mr-1" />
        ) : (
          <Copy className="h-3 w-3 mr-1" />
        )}
        Copy Text
      </Button>
      
      {isHtml && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={copyAsHtml}
            className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-600"
          >
            {copiedHtml ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Code className="h-3 w-3 mr-1" />
            )}
            Copy HTML
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={copyForDocuments}
            className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-600"
          >
            <FileText className="h-3 w-3 mr-1" />
            For Docs
          </Button>
        </>
      )}
    </div>
  );
}

