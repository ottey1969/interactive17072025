import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface ApiKeyStatus {
  service: string;
  valid: boolean;
  error?: string;
  message?: string;
}

export default function ApiKeyStatus() {
  const [apiKeys, setApiKeys] = useState<ApiKeyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchApiKeyStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/validate-keys');
      const data = await response.json();
      setApiKeys(data);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error fetching API key status:', error);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const getStatusIcon = (valid: boolean) => {
    return valid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (valid: boolean) => {
    return (
      <Badge variant={valid ? 'default' : 'destructive'}>
        {valid ? 'Valid' : 'Invalid'}
      </Badge>
    );
  };

  const allValid = apiKeys.every(key => key.valid);
  const hasErrors = apiKeys.some(key => !key.valid);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {allValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              AI Services Status
            </CardTitle>
            <CardDescription>
              {lastChecked && `Last checked: ${lastChecked.toLocaleTimeString()}`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchApiKeyStatus}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking API keys...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {hasErrors && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    Action Required
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Some AI services need valid API keys to function properly. Get your keys from:
                </p>
                <div className="space-y-1 text-sm">
                  <div>• <strong>Groq:</strong> https://console.groq.com</div>
                  <div>• <strong>Anthropic:</strong> https://console.anthropic.com</div>
                  <div>• <strong>Perplexity:</strong> https://www.perplexity.ai/settings/api</div>
                </div>
              </div>
            )}
            
            <div className="grid gap-3">
              {apiKeys.map((key) => (
                <div
                  key={key.service}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(key.valid)}
                    <div>
                      <div className="font-medium">{key.service}</div>
                      <div className="text-sm text-muted-foreground">
                        {key.valid ? (key.message || 'API key is working') : key.error}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(key.valid)}
                </div>
              ))}
            </div>

            {allValid && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    All AI services are ready!
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your grant writing, content generation, and research capabilities are fully operational.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}