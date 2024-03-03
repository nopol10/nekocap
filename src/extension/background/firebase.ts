import {
  isClient,
  isInExtension,
  isInServiceWorker,
} from "@/common/client-utils";
import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";

export const initFirebase = (
  getAuth: (app?: FirebaseApp | undefined) => Auth,
): { auth: Auth; firebaseApp: FirebaseApp } => {
  const firebaseApps = getApps();
  if (firebaseApps.length > 0) {
    const firebaseApp = firebaseApps[0];
    return { auth: getAuth(firebaseApp), firebaseApp: firebaseApp };
  }
  if (
    (isClient() && !isInExtension()) ||
    (isClient() && isInExtension()) ||
    isInServiceWorker()
  ) {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
    const firebaseApp = initializeApp(firebaseConfig);
    const auth = getAuth(firebaseApp);
    globalThis.firebaseApp = firebaseApp;
    globalThis.firebaseAuth = auth;
    return { auth, firebaseApp };
  }
  throw new Error("Could not initialize Firebase");
};
