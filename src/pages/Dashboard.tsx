      const params = new URLSearchParams()
      const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string) || (import.meta as any).env.NEXT_PUBLIC_FIREBASE_API_KEY
      const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || (import.meta as any).env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || (import.meta as any).env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      const messagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || (import.meta as any).env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
      const appId = (import.meta.env.VITE_FIREBASE_APP_ID as string) || (import.meta as any).env.NEXT_PUBLIC_FIREBASE_APP_ID
      const storageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || (import.meta as any).env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

      if (apiKey) params.set('apiKey', apiKey)
      if (authDomain) params.set('authDomain', authDomain)
      if (projectId) params.set('projectId', projectId)
      if (messagingSenderId) params.set('messagingSenderId', messagingSenderId)
      if (appId) params.set('appId', appId)
      if (storageBucket) params.set('storageBucket', storageBucket)

      const swUrl = `/firebase-messaging-sw.js${params.toString() ? `?${params.toString()}` : ''}`
      navigator.serviceWorker.register(swUrl)

