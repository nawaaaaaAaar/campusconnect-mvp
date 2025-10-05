// Firebase Cloud Messaging Service Worker
// PRD Section 5.6: Web Push Notifications with quiet hours support

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Initialize Firebase from query params passed during registration (fallback to defaults if absent)
const params = new URLSearchParams(self.location.search)
const firebaseConfig = {
  apiKey: params.get('apiKey') || "",
  authDomain: params.get('authDomain') || "",
  projectId: params.get('projectId') || "",
  storageBucket: params.get('storageBucket') || "",
  messagingSenderId: params.get('messagingSenderId') || "",
  appId: params.get('appId') || "",
}

// Only initialize if required fields are present
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId) {
    firebase.initializeApp(firebaseConfig)
  } else {
    // Initialize with an empty object to avoid runtime errors if main thread handles token
    firebase.initializeApp({})
  }
} catch (e) {
  // Prevent SW crash due to duplicate initialization
}

const messaging = firebase.messaging()

// PRD Section 5.6: Quiet hours enforcement (22:00-07:00)
function isQuietHours() {
  const now = new Date()
  const hour = now.getHours()
  return hour >= 22 || hour < 7
}

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload)
  
  // Check quiet hours - PRD requirement
  if (isQuietHours() && !payload.data?.urgent) {
    console.log('Notification suppressed due to quiet hours')
    return
  }
  
  const notificationTitle = payload.notification?.title || 'CampusConnect'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/badge-icon.png',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/action-dismiss.png'
      }
    ],
    requireInteraction: payload.data?.priority === 'high'
  }
  
  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event)
  
  event.notification.close()
  
  if (event.action === 'view') {
    // Open the app at the relevant page
    const urlToOpen = event.notification.data?.url || '/'
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if a window is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                data: event.notification.data
              })
              return client.focus()
            }
          }
          
          // No window open, open new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen)
          }
        })
    )
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('Notification dismissed')
  }
})