import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAC8xqc-WcjRf9u4ZLVZEQyFjsU570GN6M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "am-log.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "am-log",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "am-log.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "542058806713",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:542058806713:web:a6d86c3b9b260d52a5ca68",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MGBCV06BGZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Keep the session across full browser restarts and PWA cold starts so a
// returning user is never bounced to /login with their data behind it.
setPersistence(auth, browserLocalPersistence).catch(() => {
  /* storage unavailable — fall back to the SDK default */
});

/**
 * IndexedDB-backed cache with multi-tab coordination.
 *
 * This is what makes writes durable while offline: setDoc/deleteDoc resolve
 * against the local cache immediately, queue in IndexedDB, and replay
 * automatically once the connection returns — even if the tab was closed in
 * between. Reads are served from cache first, so the dashboard paints
 * instantly instead of waiting on the network.
 */
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    });
  } catch (err) {
    // Thrown if Firestore was already initialised (HMR) or IndexedDB is
    // unavailable (private browsing on some engines). The localStorage mirror
    // in local-store.ts still guarantees nothing logged is lost.
    console.warn("[3am] Persistent Firestore cache unavailable, using memory cache.", err);
    return getFirestore(app);
  }
})();
