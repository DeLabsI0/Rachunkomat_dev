import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from '@/config/firebase';

const auth = getAuth(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    await createOrUpdateUser(user);
    
    // Log the user ID on the server
    console.log(`Sending login request for user ID: ${user.uid}`);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: user.uid }),
    });
    
    if (!response.ok) {
      console.error('Failed to log user login on server');
    }

    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const createOrUpdateUser = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: new Date().toISOString(),
  };
  
  try {
    await setDoc(userRef, userData, { merge: true });
    console.log("User created/updated in Firestore");
  } catch (error) {
    console.error("Error creating/updating user in Firestore:", error);
    throw error;
  }
};

export const signOut = () => auth.signOut();

export { auth };