import { useEffect, useState } from 'react';
import api from './api';

export default function usePushNotifications(user) {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    setSubscribed(!!sub);
  };

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser');
      return;
    }

    // Request permission
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return;

    try {
      // Get VAPID public key from server
      const { data } = await api.get('/push/vapid-key');
      if (!data.publicKey) {
        console.log('Push not configured on server (no VAPID keys)');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey)
      });

      // Send subscription to server
      await api.post('/push/subscribe', { subscription });
      setSubscribed(true);
    } catch (err) {
      console.error('Failed to subscribe to push', err);
    }
  };

  const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await api.post('/push/unsubscribe');
      setSubscribed(false);
    }
  };

  return { permission, subscribed, subscribe, unsubscribe };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
