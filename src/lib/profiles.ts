import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[profiles] Supabase environment variables not configured");
}

const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role_label: string | null;
  preferred_mood: string | null;
  language: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // Only log real Supabase errors, not "no row found"
      if (error.code !== 'PGRST116') {
        console.error("[profiles] Error fetching profile:", error);
      }
      return null;
    }

    return data;
  } catch (e) {
    console.error("[profiles] Error fetching profile:", e);
    return null;
  }
}

export async function upsertUserProfile(
  userId: string,
  profileData: Partial<Profile>
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[profiles] Error upserting profile:", error);
      return null;
    }

    return data;
  } catch (e) {
    console.error("[profiles] Error upserting profile:", e);
    return null;
  }
}

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.onboarding_completed === true && !!profile.display_name;
}

export async function getProfileById(userId: string): Promise<Partial<Profile> | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url, role_label")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error("[profiles] Error fetching profile by id:", error);
      }
      return null;
    }

    return data;
  } catch (e) {
    console.error("[profiles] Error fetching profile by id:", e);
    return null;
  }
}

export function getDisplayName(
  profile: Profile | null,
  userEmail: string | null
): string {
  if (!profile) {
    return "Breakroom friend";
  }

  // Priority: display_name > username > "Breakroom friend"
  if (profile.display_name) {
    return profile.display_name;
  }

  if (profile.username) {
    return profile.username;
  }

  return "Breakroom friend";
}
