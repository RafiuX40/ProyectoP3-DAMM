// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

export const environment = {
  production: false,
<<<<<<< Updated upstream
  firebaseConfig:{
  apiKey: "AIzaSyCb2dAo7aVValu6lAVB-YjKufQwOaHWrFI",
  authDomain: "proyectop3-damm.firebaseapp.com",
  projectId: "proyectop3-damm",
  storageBucket: "proyectop3-damm.firebasestorage.app",
  messagingSenderId: "533012786408",
  appId: "1:533012786408:web:32d9298d93ad9fd4d3ed5d"
=======
  firebaseConfig: {
    apiKey: "AIzaSyCb2dAo7aVValu6lAVB-YjKufQwOaHWrFI",
    authDomain: "proyectop3-damm.firebaseapp.com",
    projectId: "proyectop3-damm",
    storageBucket: "proyectop3-damm.firebasestorage.app",
    messagingSenderId: "533012786408",
    appId: "1:533012786408:web:32d9298d93ad9fd4d3ed5d"
>>>>>>> Stashed changes
  }
};

// Initialize Firebase
const app = initializeApp(environment.firebaseConfig);