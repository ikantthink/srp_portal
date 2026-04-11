"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "@/types/database";

interface UserState {
  user: User | null;
  role: Role;
  loading: boolean;
}

export function useUser() {
  const [state, setState] = useState<UserState>({
    user: null,
    role: "user",
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ user: null, role: "user", loading: false });
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setState({
        user,
        role: (roleData?.role as Role) || "user",
        loading: false,
      });
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        getUser();
      } else {
        setState({ user: null, role: "user", loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
