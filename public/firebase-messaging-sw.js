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


