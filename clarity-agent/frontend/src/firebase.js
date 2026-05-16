import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgfutNjk9bhVOEk_JqSRKeLoY--O7vE4E",
  authDomain: "agent-meet-1.firebaseapp.com",
  projectId: "agent-meet-1",
  storageBucket: "agent-meet-1.firebasestorage.app",
  messagingSenderId: "327327682512",
  appId: "1:327327682512:web:26cdaef9ff3e544275b3d5",
  measurementId: "G-1F5CWBJ77H"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
