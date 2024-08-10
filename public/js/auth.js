// Import Firebase Authentication methods
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

// Get the Firebase Authentication instance
const auth = getAuth();

// Sign in with email and password
export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      console.log('Signed in:', userCredential.user);
      return userCredential.user;
    })
    .catch((error) => {
      console.error('Error signing in:', error);
      throw new Error('Error signing in: ' + error.message);
    });
}

// Sign up with email and password
export function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up
      console.log('Signed up:', userCredential.user);
      return userCredential.user;
    })
    .catch((error) => {
      console.error('Error signing up:', error);
      throw new Error('Error signing up: ' + error.message);
    });
}

// Reset password
export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
    .then(() => {
      console.log('Password reset email sent.');
      return 'Password reset email sent.';
    })
    .catch((error) => {
      console.error('Error sending password reset email:', error);
      throw new Error('Error sending password reset email: ' + error.message);
    });
}
