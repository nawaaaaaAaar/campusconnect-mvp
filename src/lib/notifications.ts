// Simplified FCM Notification Service - PRD Section 5.6
// Demonstrates FCM integration concepts with quiet hours and rate limiting
// In production, this would integrate with actual Firebase Cloud Messaging

import { campusAPI } from './api'

class NotificationService {
  private permission: NotificationPermission = 'default'
  private isSupported = false
  private hasToken = false

  constructor() {
    this.checkSupport()
  }

  private checkSupport() {
    this.isSupported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window
    
    if (this.isSupported) {
      this.permission = Notification.permission
    }
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications not supported in this browser')
      return false
    }

    try {
      // Request permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission not granted')
        return false
      }

      // In a real implementation, this would:
      // 1. Initialize Firebase SDK
      // 2. Get FCM token
      // 3. Register token with backend
      
      // For demo, simulate token registration
      this.hasToken = true
      await this.simulateTokenRegistration()
      
      console.log('FCM notifications initialized (demo mode)')
      return true
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
      return false
    }
  }

  private async simulateTokenRegistration(): Promise<void> {
    try {
      const demoToken = `demo_token_${Date.now()}`
      await campusAPI.registerDeviceToken(demoToken)
    } catch (error) {
      console.error('Failed to register demo token:', error)
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) return 'denied'
    
    if (this.permission === 'granted') {
      return 'granted'
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    return permission
  }

  // PRD Section 5.6: Quiet hours check (22:00-07:00)
  private isQuietHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    return hour >= 22 || hour < 7
  }

  // Set up foreground message handling (demo implementation)
  setupForegroundHandling(onNotificationReceived?: (payload: any) => void) {
    // In a real implementation, this would use Firebase onMessage
    console.log('Foreground notification handling set up (demo mode)')
    
    if (onNotificationReceived) {
      // Simulate receiving a notification after 5 seconds for demo
      setTimeout(() => {
        if (!this.isQuietHours()) {
          onNotificationReceived({
            notification: {
              title: 'Welcome to CampusConnect!',
              body: 'Your notifications are now enabled.'
            },
            data: { demo: true }
          })
        }
      }, 5000)
    }
  }

  // Show browser notification
  private showBrowserNotification(options: {
    title: string
    body: string
    data?: any
  }) {
    if (this.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: '/favicon.ico',
        tag: options.data?.tag || 'default',
        data: options.data
      })
    }
  }

  // Test notification - for development
  async sendTestNotification(): Promise<void> {
    if (this.permission === 'granted') {
      // Check quiet hours
      if (this.isQuietHours()) {
        console.log('Test notification suppressed due to quiet hours')
        return
      }
      
      this.showBrowserNotification({
        title: 'Test Notification',
        body: 'CampusConnect notifications are working! 🎉',
        data: { test: true }
      })
    }
  }

  // Get current notification settings
  getSettings() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      hasToken: this.hasToken,
      isQuietHours: this.isQuietHours()
    }
  }

  // Disable notifications
  async disable(): Promise<void> {
    if (this.hasToken) {
      this.hasToken = false
      console.log('Notifications disabled (demo mode)')
    }
  }
}

export const notificationService = new NotificationService()