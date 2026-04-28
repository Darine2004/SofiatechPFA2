import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC7xB75dup3drIKUhn_WeLa2hG4ub4S8js",
  authDomain: "sofiatech-assets.firebaseapp.com",
  databaseURL: "https://sofiatech-assets-default-rtdb.firebaseio.com",
  projectId: "sofiatech-assets",
  storageBucket: "sofiatech-assets.firebasestorage.app",
  messagingSenderId: "172963727942",
  appId: "1:172963727942:web:b04ebb285a05fc4a6b1847",
  measurementId: "G-07VSE25TT3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
