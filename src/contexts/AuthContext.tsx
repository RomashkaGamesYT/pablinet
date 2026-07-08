import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  banned: boolean;
  clearBanned: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  banned: false,
  clearBanned: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ban check + presence ping
  useEffect(() => {
    if (!user) return;

    const checkBan = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("user_id", user.id)
        .maybeSingle();
      if ((data as any)?.is_banned) {
        setBanned(true);
        await supabase.auth.signOut();
      }
    };
    checkBan();

    const ping = () => {
      supabase.from("profiles").update({ last_seen_at: new Date().toISOString() } as any).eq("user_id", user.id).then(() => {});
    };
    ping();
    const id = setInterval(() => {
      ping();
      checkBan();
    }, 60000);
    return () => clearInterval(id);
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const clearBanned = () => setBanned(false);

  return (
    <AuthContext.Provider value={{ user, session, loading, banned, clearBanned, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
