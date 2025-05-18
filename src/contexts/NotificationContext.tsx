
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '@/types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'userId' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications from localStorage on initial render
  useEffect(() => {
    if (user?.id) {
      const storedNotifications = localStorage.getItem(`jobApp_notifications_${user.id}`);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        // Add demo notifications for new users
        const demoNotifications: Notification[] = [
          {
            id: '1',
            userId: user.id,
            message: "Congratulations! Your resume has been shortlisted for Google. Our team will reach out to you soon with further details. Stay tuned for the next steps!",
            read: false,
            date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            type: 'success',
          },
          {
            id: '2',
            userId: user.id,
            message: "Great news! Your resume has been shortlisted for an opportunity at Amazon. Our recruitment team will contact you soon with the next steps. Stay tuned and prepare for the exciting journey ahead.",
            read: false,
            date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            type: 'info',
          },
        ];
        
        setNotifications(demoNotifications);
        localStorage.setItem(`jobApp_notifications_${user.id}`, JSON.stringify(demoNotifications));
      }
    }
  }, [user?.id]);

  const addNotification = (notification: Omit<Notification, 'id' | 'userId' | 'read'>) => {
    if (!user?.id) return;
    
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      userId: user.id,
      read: false,
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    
    // Store in localStorage
    localStorage.setItem(`jobApp_notifications_${user.id}`, JSON.stringify(updatedNotifications));
  };

  const markAsRead = (id: string) => {
    if (!user?.id) return;
    
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    
    setNotifications(updatedNotifications);
    localStorage.setItem(`jobApp_notifications_${user.id}`, JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = () => {
    if (!user?.id) return;
    
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem(`jobApp_notifications_${user.id}`, JSON.stringify(updatedNotifications));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
