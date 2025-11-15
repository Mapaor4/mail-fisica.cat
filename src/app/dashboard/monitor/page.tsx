'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mail.example.com';
const APEX_DOMAIN = process.env.NEXT_PUBLIC_APEX_DOMAIN || 'example.com';

interface WebhookLog {
  id: string;
  from: string;
  to: string;
  subject: string;
  received_at: string;
  body_preview: string;
}

export default function WebhookMonitorPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/webhooks/incomingMail?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.webhooks);
      } else {
        setError(data.error || 'Failed to fetch webhook logs');
      }
    } catch (err) {
      setError('Error connecting to webhook endpoint');
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Monitor de webhooks" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Carregant el monitor de webhooks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Monitor de webhooks" 
        onRefresh={() => fetchLogs(true)} 
        isRefreshing={isRefreshing}
      />
      
      <div className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              {/* <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" /> */}
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Webhook Endpoint</h3>
                <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
                  Configura ForwardEmail perquè enviï els POST requests a:
                </p>
                <code className="block bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 px-3 py-2 rounded text-sm font-mono">
                  {SITE_URL}/api/webhooks/incomingMail
                </code>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                  Un cop fet al enviar correus electrònics a usuaris de fisica.cat hauries de veure aparèixer webhooks aquí.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <XCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Webhook Logs */}
          {logs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No s&apos;ha rebut cap webhook encara</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Envia un correu de prova a un alias@{APEX_DOMAIN} existent per veure&apos;l apareixer aquí
              </p>
              <button
                onClick={() => fetchLogs(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Actualitzar ara
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Webhooks recents rebuts ({logs.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {log.subject}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(log.received_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm mb-2">
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">De:</span> {log.from}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Per a:</span> {log.to}
                          </p>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {log.body_preview}
                        </p>
                        
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          ID: {log.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testing Instructions */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Com provar el monitor de webhooks</h4>
            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
              <li>Envia un mail a un <strong>alias@{APEX_DOMAIN}</strong> existent</li>
              <li>Espera uns segons per a que ForwardEmail el processi</li>
              <li>Clica el botó superior Actualitzar</li>
              <li>El correu hauria d&apos;apareixer a la llista</li>
            </ol>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Si els correus no apareixen comprova la configuració DNS de ForwardEmail i els logs de Vercel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
