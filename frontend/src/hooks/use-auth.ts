"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthStorage,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-storage";
import {
  logout as logoutRequest,
  signIn as signInRequest,
  signUp as signUpRequest,
} from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type {
  AuthResponse,
  SignInPayload,
  SignUpPayload,
} from "@/types/auth.types";

function getDestination({ user }: AuthResponse): string {
  return user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
}

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const signIn = useCallback(
    async (payload: SignInPayload): Promise<void> => {
      setLoading(true);
      try {
        const response = await signInRequest(payload);
        setAccessToken(response.tokens.accessToken);
        setRefreshToken(response.tokens.refreshToken);
        setAuth(response.user, response.tokens.accessToken);
        router.replace(getDestination(response));
        router.refresh();
      } finally {
        setLoading(false);
      }
    },
    [router, setAuth, setLoading]
  );

  const signUp = useCallback(
    async (payload: SignUpPayload): Promise<void> => {
      setLoading(true);
      try {
        const response = await signUpRequest(payload);
        setAccessToken(response.tokens.accessToken);
        setRefreshToken(response.tokens.refreshToken);
        setAuth(response.user, response.tokens.accessToken);
        router.replace(getDestination(response));
        router.refresh();
      } finally {
        setLoading(false);
      }
    },
    [router, setAuth, setLoading]
  );

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await logoutRequest();
    } finally {
      clearAuthStorage();
      clearAuth();
      router.replace("/sign-in");
      router.refresh();
    }
  }, [clearAuth, router, setLoading]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}
