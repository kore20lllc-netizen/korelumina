import { useEffect, useState } from "react";
import { auth } from "@/providers/registry";
import type { User } from "@/providers/types";

export function useIsAuthenticated() {
  const [authed, setAuthed] = useState<boolean>(() => !!auth.getUser());

  useEffect(() => {
    return auth.onChange(() => {
      setAuthed(!!auth.getUser());
    });
  }, []);

  return authed;
}

export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(() => auth.getUser());

  useEffect(() => {
    return auth.onChange(() => {
      setUser(auth.getUser());
    });
  }, []);

  return user;
}
