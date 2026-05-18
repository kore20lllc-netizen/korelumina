import { useEffect, useState } from "react";
import { isAuthenticated, subscribeAuth } from "@/lib/auth";
import { auth } from "@/providers/registry";
import type { User } from "@/providers/types";

export function useIsAuthenticated() {
  const [authed, setAuthed] = useState(isAuthenticated);
  useEffect(() => subscribeAuth(() => setAuthed(isAuthenticated())), []);
  return authed;
}

export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(() => auth.getUser());
  useEffect(() => auth.onChange(() => setUser(auth.getUser())), []);
  return user;
}