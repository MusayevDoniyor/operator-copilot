import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@sadoo/types";
import Cookies from "js-cookie";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      login: (token, user) => {
        Cookies.set("token", token, { expires: 1 }); // 1 day
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove("token");
        set({ token: null, user: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setHydrated: (val) => set({ isHydrated: val }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.token) {
          Cookies.set("token", state.token, { expires: 1 });
        }
      },
    },
  ),
);
