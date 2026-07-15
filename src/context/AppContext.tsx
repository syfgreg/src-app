import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { db, hashPassword } from "../data/db";
import { seedIfNeeded } from "../data/seed";
import { cloudEnabled, supabase } from "../data/supabase";
import { startSync, stopSync } from "../data/sync";
import type { User } from "../domain/types";

interface AppContextValue {
  user: User | null;
  ready: boolean;
  cloud: boolean;
  /** true while the user is in a password-recovery session (clicked a reset link) */
  recovery: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  magicLink: (email: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  logout: () => void;
}

const AppContext = createContext<AppContextValue>(null!);
export const useApp = () => useContext(AppContext);

const LOCAL_SESSION_KEY = "src-session-user-id";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const started = useRef(false);

  // ---- profile hydration (cloud) ------------------------------------------
  const loadCloudUser = useCallback(async (id: string, email?: string) => {
    if (!started.current) {
      await startSync();
      started.current = true;
    }
    let u = await db.users.get(id);
    if (!u && supabase) {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (data) {
        u = {
          id: data.id,
          email: data.email,
          name: data.name,
          nickname: data.nickname ?? undefined,
          roleTag: data.role_tag,
          createdAt: new Date(data.created_at).getTime(),
        };
        await db.users.put(u);
      }
    }
    setUser(u ?? (email ? { id, email, name: email.split("@")[0], roleTag: "JAFNG", createdAt: Date.now() } : null));
  }, []);

  // ---- bootstrap -----------------------------------------------------------
  useEffect(() => {
    (async () => {
      if (cloudEnabled && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) await loadCloudUser(data.session.user.id, data.session.user.email ?? undefined);
        setReady(true);
        const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
          // A reset-link click lands here with a recovery session; surface the
          // update-password screen instead of dropping straight into the app.
          if (event === "PASSWORD_RECOVERY") setRecovery(true);
          if (session) {
            await loadCloudUser(session.user.id, session.user.email ?? undefined);
          } else if (event === "SIGNED_OUT") {
            stopSync();
            started.current = false;
            setUser(null);
          }
        });
        return () => sub.subscription.unsubscribe();
      }
      // local-only mode
      await seedIfNeeded();
      const saved = localStorage.getItem(LOCAL_SESSION_KEY);
      if (saved) {
        const u = await db.users.get(saved);
        if (u) setUser(u);
      }
      setReady(true);
    })();
  }, [loadCloudUser]);

  // ---- auth actions --------------------------------------------------------
  const login = useCallback(async (email: string, password: string) => {
    const e = email.trim().toLowerCase();
    if (!e || !password) return "Email and password are required.";
    if (cloudEnabled && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password });
      if (error) return error.message;
      // Inactive anglers are on the roster for the record but can't log in.
      const { data: prof } = await supabase.from("profiles").select("role_tag").eq("email", e).maybeSingle();
      if (prof?.role_tag === "INACTIVE") {
        await supabase.auth.signOut();
        return "This angler is inactive and can't log in. Contact the M.O.C.";
      }
      return null;
    }
    const u = await db.users.where("email").equals(e).first();
    if (!u) return "No angler registered with that email.";
    if (u.passwordHash !== (await hashPassword(password))) return "Wrong password. The M.O.C. is watching.";
    if (u.roleTag === "INACTIVE") return "This angler is inactive and can't log in. Contact the M.O.C.";
    setUser(u);
    localStorage.setItem(LOCAL_SESSION_KEY, u.id);
    return null;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const e = email.trim().toLowerCase();
    if (!name.trim()) return "Name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return "Enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (cloudEnabled && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: window.location.origin },
      });
      if (error) return error.message;
      if (!data.session) return "Account created — check your email to confirm, then log in.";
      return null; // onAuthStateChange takes over
    }
    if (await db.users.where("email").equals(e).first()) return "That email is already on the roster.";
    // Honor a pending M.O.C. invite: inherit the pre-assigned role (and name).
    const invite = await db.invites.where("email").equals(e).first();
    const u: User = {
      id: crypto.randomUUID(),
      email: e,
      name: name.trim(),
      roleTag: invite?.roleTag ?? "JAFNG",
      passwordHash: await hashPassword(password),
      createdAt: Date.now(),
    };
    await db.users.add(u);
    if (invite) await db.invites.delete(invite.id);
    setUser(u);
    localStorage.setItem(LOCAL_SESSION_KEY, u.id);
    return null;
  }, []);

  const magicLink = useCallback(async (email: string) => {
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return "Enter a valid email address.";
    if (!cloudEnabled || !supabase) return "Magic links need the cloud backend configured.";
    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: window.location.origin },
    });
    return error ? error.message : "Check your email for a one-tap sign-in link.";
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return "Enter your email above first, then tap reset.";
    if (!cloudEnabled || !supabase) return "Password reset needs the cloud backend configured.";
    const { error } = await supabase.auth.resetPasswordForEmail(e, {
      redirectTo: window.location.origin,
    });
    return error ? error.message : "Check your email for a link to reset your password.";
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!cloudEnabled || !supabase) return "Password reset needs the cloud backend configured.";
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return error.message;
    setRecovery(false);
    return null;
  }, []);

  const logout = useCallback(() => {
    setRecovery(false);
    if (cloudEnabled && supabase) {
      supabase.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        ready,
        cloud: cloudEnabled,
        recovery,
        login,
        register,
        magicLink,
        resetPassword,
        updatePassword,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
