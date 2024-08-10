// Import and configure Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Check user authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in:', user);
    // User is signed in, you can add logic to redirect or show user data
    document.getElementById('user-info').textContent = `Welcome, ${user.email}`;
  } else {
    console.log('No user is signed in.');
    // User is signed out, you can add logic to show login page
    window.location.href = 'login.html';
  }
});

// Function to handle user sign-in with email and password
function signInWithEmail(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log('Signed in:', user);
      window.location.href = 'index.html'; // Redirect to main page after sign-in
    })
    .catch((error) => {
      console.error('Error signing in:', error);
      alert('Error signing in: ' + error.message);
    });
}

// Function to handle user sign-out
function signOut() {
  auth.signOut()
    .then(() => {
      console.log('User signed out.');
      window.location.href = 'login.html'; // Redirect to login page after sign-out
    })
    .catch((error) => {
      console.error('Error signing out:', error);
    });
}

// Function to handle password reset
function resetPassword(email) {
  auth.sendPasswordResetEmail(email)
    .then(() => {
      console.log('Password reset email sent.');
      alert('Password reset email sent to ' + email);
    })
    .catch((error) => {
      console.error('Error sending password reset email:', error);
      alert('Error sending password reset email: ' + error.message);
    });
}

// Add event listeners or other logic here
document.getElementById('sign-out-btn').addEventListener('click', signOut);
document.getElementById('reset-password-btn').addEventListener('click', () => {
  const email = document.getElementById('email-input').value;
  resetPassword(email);
});
      
