import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface OfflineNotificationProps {
  onOfflineMode: (isOffline: boolean) => void;
}

export function OfflineNotification({ onOfflineMode }: OfflineNotificationProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Initial check
    checkConnection();

    // Add event listeners for online/offline status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connection check
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkConnection = async () => {
    try {
      // Try to make a simple request to Supabase
      const { data } = await supabase.from('sync_status').select('is_online').maybeSingle();
      const hasConnection = !!data;

      if (isOnline && !hasConnection) {
        handleOffline();
      } else if (!isOnline && hasConnection) {
        handleOnline();
      }
    } catch (error) {
      if (isOnline) {
        handleOffline();
      }
    }
  };

  const handleOnline = () => {
    setIsOnline(true);
    setShowPrompt(false);
    onOfflineMode(false);
    toast.success('Conexão restaurada!');
  };

  const handleOffline = () => {
    setIsOnline(false);
    setShowPrompt(true);
  };

  const enableOfflineMode = async () => {
    try {
      onOfflineMode(true);
      toast.success('Modo offline ativado');
      setShowPrompt(false);
    } catch (error) {
      console.error('Error enabling offline mode:', error);
      toast.error('Erro ao ativar modo offline');
    }
  };

  const tryReconnect = async () => {
    const toastId = toast.loading('Tentando reconectar...');
    try {
      await checkConnection();
      if (!isOnline) {
        toast.error('Não foi possível reconectar', { id: toastId });
      } else {
        toast.success('Conexão restaurada!', { id: toastId });
      }
    } catch (error) {
      toast.error('Erro ao tentar reconectar', { id: toastId });
    }
  };

  // Only show the notification when offline is detected
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-4 max-w-md">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <WifiOff className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Conexão Perdida
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              A conexão com a internet foi perdida. Deseja continuar operando em modo offline?
            </p>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={enableOfflineMode}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Continuar Offline
              </button>
              <button
                onClick={tryReconnect}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Tentar Reconectar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}