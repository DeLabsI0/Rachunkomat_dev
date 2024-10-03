const MOCK_USER_ID = 'MJ0pvaGf6YXT63TwXBpQIL0AH9O2';

export const mockAuth = {
  currentUser: {
    uid: MOCK_USER_ID
  },
  onAuthStateChanged: (callback: (user: { uid: string } | null) => void) => {
    callback({ uid: MOCK_USER_ID });
    return () => {}; // Return a no-op function for unsubscribe
  }
};

export const useAuth = () => ({
  user: { uid: MOCK_USER_ID },
  loading: false
});