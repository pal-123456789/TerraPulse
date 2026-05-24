 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface PushNotificationState {
   isSupported: boolean;
   permission: NotificationPermission | 'default';
   isEnabled: boolean;
 }
 
 export const usePushNotifications = () => {
   const [state, setState] = useState<PushNotificationState>({
     isSupported: false,
     permission: 'default',
     isEnabled: false,
   });
 
   useEffect(() => {
     // Check if notifications are supported
     const isSupported = 'Notification' in window;
     
     if (isSupported) {
       setState(prev => ({
         ...prev,
         isSupported: true,
         permission: Notification.permission,
         isEnabled: Notification.permission === 'granted',
       }));
     }
   }, []);
 
   const requestPermission = useCallback(async () => {
     if (!state.isSupported) {
       toast.error('Push notifications are not supported in this browser');
       return false;
     }
 
     try {
       const permission = await Notification.requestPermission();
       
       setState(prev => ({
         ...prev,
         permission,
         isEnabled: permission === 'granted',
       }));
 
       if (permission === 'granted') {
         toast.success('Push notifications enabled!');
         // Show a test notification
         showNotification('TerraPulse', {
           body: 'You will now receive real-time alerts for environmental anomalies.',
           icon: '/favicon.ico',
         });
         return true;
       } else if (permission === 'denied') {
         toast.error('Notification permission denied. Please enable in browser settings.');
         return false;
       }
       
       return false;
     } catch (error) {
       console.error('Error requesting notification permission:', error);
       toast.error('Failed to enable push notifications');
       return false;
     }
   }, [state.isSupported]);
 
   const showNotification = useCallback((title: string, options?: NotificationOptions) => {
     if (!state.isEnabled) {
       console.log('Notifications not enabled');
       return;
     }
 
     try {
       const notification = new Notification(title, {
         icon: '/favicon.ico',
         badge: '/favicon.ico',
         ...options,
       });
 
       notification.onclick = () => {
         window.focus();
         notification.close();
       };
 
       // Auto-close after 5 seconds
       setTimeout(() => notification.close(), 5000);
     } catch (error) {
       console.error('Error showing notification:', error);
     }
   }, [state.isEnabled]);
 
   const sendAnomalyAlert = useCallback((anomaly: {
     name: string;
     severity: string;
     description?: string;
   }) => {
     const severityEmoji = {
       low: '🟢',
       medium: '🟡',
       high: '🟠',
       critical: '🔴'
     };
 
     showNotification(`${severityEmoji[anomaly.severity as keyof typeof severityEmoji] || '⚠️'} ${anomaly.name}`, {
       body: anomaly.description || `${anomaly.severity.toUpperCase()} severity anomaly detected`,
       tag: 'anomaly-alert',
       requireInteraction: anomaly.severity === 'critical' || anomaly.severity === 'high',
     });
   }, [showNotification]);
 
   const sendPredictionAlert = useCallback((prediction: {
     type: string;
     riskLevel: string;
     location?: string;
   }) => {
     const riskEmoji = {
       low: '🟢',
       moderate: '🟡',
       high: '🟠',
       extreme: '🔴'
     };
 
     showNotification(`📊 Prediction Alert`, {
       body: `${riskEmoji[prediction.riskLevel as keyof typeof riskEmoji] || '⚡'} ${prediction.type}: ${prediction.riskLevel} risk${prediction.location ? ` at ${prediction.location}` : ''}`,
       tag: 'prediction-alert',
     });
   }, [showNotification]);
 
   return {
     ...state,
     requestPermission,
     showNotification,
     sendAnomalyAlert,
     sendPredictionAlert,
   };
 };
 
 export default usePushNotifications;