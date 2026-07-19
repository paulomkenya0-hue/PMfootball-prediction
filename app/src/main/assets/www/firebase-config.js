// ============================================================
// WEKA HAPA TAARIFA ZA FIREBASE PROJECT YAKO
// Zinapatikana: Firebase Console -> Project Settings -> General
//               -> "Your apps" -> Web app -> SDK setup and config
// Angalia README.md sehemu ya "Kuunganisha Firebase" kwa hatua kamili.
// ============================================================
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7nV2vXqDDelCnFxKJFiV-UX2nKO5M0k8",
  authDomain: "utabiri-mechi.firebaseapp.com",
  projectId: "utabiri-mechi",
  storageBucket: "utabiri-mechi.firebasestorage.app",
  messagingSenderId: "1018501069027",
  appId: "1:1018501069027:web:5636caaf823d54ac39add6",
  measurementId: "G-X01M3B95D0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// PIN ya kuingia kama Msimamizi ndani ya programu.
// BADILISHA hii kabla ya kutoa APK kwa watu wengine!
const ADMIN_PIN = "7729";
