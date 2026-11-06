import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import * as SecureStore from "expo-secure-store";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

type User = {
  id: string;
  email: string;
  name: string | null;
  photo: string | null;
};
type Ctx = {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync("user");
      if (saved) setUser(JSON.parse(saved));
      setLoading(false);
    })();
  }, []);

  const signIn = async () => {
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (res.type !== "success") return;

    const { idToken, user: u } = res.data;
    const profile: User = {
      id: u.id,
      email: u.email,
      name: u.name,
      photo: u.photo,
    };
    setIdToken(idToken);
    setUser(profile);
    await SecureStore.setItemAsync("user", JSON.stringify(profile));
  };

  const signOut = async () => {
    await GoogleSignin.signOut();
    await SecureStore.deleteItemAsync("user");
    setUser(null);
    setIdToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, idToken, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
