import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "employer" | "employee";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      if (error) {
        console.warn("Error fetching role:", error);
        return;
      }
      if (data) setRole(data.role as AppRole);
    } catch (err) {
      console.error("Failed to fetch role:", err);
    }
  };

  // Initialize auth once when component mounts
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchRole(session.user.id);
          } else {
            setRole(null);
          }
          
          setIsInitialized(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (isMounted) {
          setIsInitialized(true);
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for auth changes only after initialization
  useEffect(() => {
    if (!isInitialized) return;

    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchRole(session.user.id);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [isInitialized]);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("Signup failed");

    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: data.user.id,
      role: selectedRole,
    });
    if (roleError) throw roleError;

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id,
      full_name: fullName,
    });
    if (profileError) throw profileError;

    setRole(selectedRole);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
