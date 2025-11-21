import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// -------------------------------------------------------------------------
// IMPORTANT: REMPLACEZ CECI PAR VOTRE CONFIGURATION FIREBASE
// Allez sur https://console.firebase.google.com/
// Créez un projet > Paramètres du projet > Général > Vos applications > Web
// -------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSy...", // VOTRE_API_KEY
  authDomain: "votre-projet.firebaseapp.com", // VOTRE_AUTH_DOMAIN
  projectId: "votre-projet", // VOTRE_PROJECT_ID
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456..."
};

// Initialisation conditionnelle pour éviter les crashs si config vide
let app;
let auth;
let db;
let googleProvider;

try {
  // On vérifie sommairement si la config a été remplie
  if (firebaseConfig.apiKey === "AIzaSy...") {
     console.warn("⚠️ ATTENTION: Configuration Firebase manquante dans services/firebase.ts");
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  }
} catch (e) {
  console.error("Erreur initialisation Firebase:", e);
}

export const signInWithGoogle = async () => {
  if (!auth) {
    alert("Firebase n'est pas configuré. Vérifiez services/firebase.ts");
    return;
  }
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Erreur connexion:", error);
  }
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erreur déconnexion:", error);
  }
};

export { auth, db };
