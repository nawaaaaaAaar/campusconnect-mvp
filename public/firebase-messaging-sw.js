// Service Worker for push notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installing')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating')
  event.waitUntil(self.clients.claim())
})

// Handle background messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'BACKGROUND_MESSAGE') {
    console.log('Background message received:', event.data.payload)
    
    // Handle the background message
    const { title, body, icon, data } = event.data.payload
    
    // Show notification
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      data,
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    })
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data
  
  if (action === 'view' || !action) {
    // Open the app or focus existing window
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if there is already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no window/tab is already open, open a new one
        if (self.clients.openWindow) {
          let targetUrl = '/'
          
          // Navigate to specific page based on notification data
          if (data && data.targetUrl) {
            targetUrl = data.targetUrl
          }
          
          return self.clients.openWindow(targetUrl)
        }
      })
    )
  }
})

// Handle push events (for future implementation with real push service)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)
  
  let notificationData = {
    title: 'CampusConnect',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  }
  
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        ...notificationData,
        ...data
      }
    } catch (error) {
      console.error('Error parsing push data:', error)
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    })
  )
})

console.log('Firebase Messaging Service Worker loaded')