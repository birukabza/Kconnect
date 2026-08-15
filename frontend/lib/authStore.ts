import { create } from "zustand";
import { persist } from "zustand/middleware";

import { AuthSession, AuthUser } from "./auth";


interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  setUser: (user: AuthUser) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}


export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hydrated: false,

      setSession: (session) =>
        set({
          accessToken: session.access_token,
          user: session.user,
        }),

      setUser: (user) => set({ user }),

      setHydrated: (hydrated) => set({ hydrated }),

      logout: () =>
        set({
          accessToken: null,
          user: null,
        }),
    }),
    {
      name: "kconnect-auth-v1",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
