import React, { useEffect } from 'react'

export function Dashboard() {
  useEffect(() => {
    // Register service worker for push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const params = new URLSearchParams()
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string
      const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string
      const appId = import.meta.env.VITE_FIREBASE_APP_ID as string
      const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string

      if (apiKey) params.set('apiKey', apiKey)
      if (authDomain) params.set('authDomain', authDomain)
      if (projectId) params.set('projectId', projectId)
      if (messagingSenderId) params.set('messagingSenderId', messagingSenderId)
      if (appId) params.set('appId', appId)
      if (storageBucket) params.set('storageBucket', storageBucket)

      const swUrl = `/firebase-messaging-sw.js${params.toString() ? `?${params.toString()}` : ''}`
      navigator.serviceWorker.register(swUrl).catch(() => {})
    }
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-600 mt-2">Welcome to CampusConnect.</p>
    </div>
  )
}