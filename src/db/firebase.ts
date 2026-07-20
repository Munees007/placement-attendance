// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getDatabase} from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_DB_APIKEY,
  authDomain: import.meta.env.VITE_APP_DB_AUTHDOMAIN,
  databaseURL: import.meta.env.VITE_APP_DB_DATABASE_URL,
  projectId: import.meta.env.VITE_APP_DB_PROJECTID,
  storageBucket: import.meta.env.VITE_APP_DB_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_APP_DB_MESSAGINGSENDERID,
  appId: import.meta.env.VITE_APP_DB_APPID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app)

export {app,db}

