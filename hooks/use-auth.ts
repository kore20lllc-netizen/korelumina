import { useEffect, useState } from "react";
import { isAuthenticated, subscribeAuth } from "@/lib/auth";

export function useIsAuthenticated() {
  const [authed, setAuthed] = useState(isAuthenticated);
  useEffect(() => subscribeAuth(() => setAuthed(isAuthenticated())), []);
  return authed;
}