import { supabase, isSupabaseConfigured } from "./supabase";

const LOCAL_STORAGE_KEY = "digital-breakroom-story-drafts";

export interface StoryDraft {
  id: string;
  title: string;
  category: string;
  mood_tag: string;
  body: string;
  anonymous: boolean;
  created_at: string;
  updated_at: string;
}

// Local storage functions
export function getLocalDrafts(): StoryDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading local drafts:", error);
    return [];
  }
}

export function saveLocalDraft(draft: Omit<StoryDraft, "id" | "created_at" | "updated_at">): StoryDraft {
  const drafts = getLocalDrafts();
  const newDraft: StoryDraft = {
    ...draft,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  drafts.unshift(newDraft);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Error saving local draft:", error);
  }
  return newDraft;
}

export function deleteLocalDraft(id: string): void {
  const drafts = getLocalDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting local draft:", error);
  }
}

export function clearLocalDrafts(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing local drafts:", error);
  }
}

// Cloud functions using Supabase
export async function getCloudDrafts(userId: string): Promise<{ drafts: StoryDraft[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { drafts: [], error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("story_drafts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading cloud drafts:", error);
      return { drafts: [], error: error.message };
    }

    return { drafts: data || [], error: null };
  } catch (error) {
    console.error("Error loading cloud drafts:", error);
    return { drafts: [], error: "Could not load drafts" };
  }
}

export async function saveCloudDraft(
  userId: string,
  draft: Omit<StoryDraft, "id" | "created_at" | "updated_at">
): Promise<{ draft: StoryDraft | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { draft: null, error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("story_drafts")
      .insert({
        user_id: userId,
        title: draft.title,
        category: draft.category,
        mood_tag: draft.mood_tag,
        body: draft.body,
        anonymous: draft.anonymous,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving cloud draft:", error);
      return { draft: null, error: error.message };
    }

    return { draft: data as StoryDraft, error: null };
  } catch (error) {
    console.error("Error saving cloud draft:", error);
    return { draft: null, error: "Could not save draft" };
  }
}

export async function deleteCloudDraft(id: string, userId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("story_drafts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting cloud draft:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("Error deleting cloud draft:", error);
    return { error: "Could not delete draft" };
  }
}

export async function syncLocalDraftsToCloud(userId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  const localDrafts = getLocalDrafts();
  if (localDrafts.length === 0) {
    return { error: null };
  }

  try {
    // Upload each local draft to cloud
    for (const draft of localDrafts) {
      const { error } = await saveCloudDraft(userId, {
        title: draft.title,
        category: draft.category,
        mood_tag: draft.mood_tag,
        body: draft.body,
        anonymous: draft.anonymous,
      });

      if (error) {
        console.error("Error syncing draft:", error);
        return { error };
      }
    }

    // Clear local drafts after successful sync
    clearLocalDrafts();

    return { error: null };
  } catch (error) {
    console.error("Error syncing local drafts:", error);
    return { error: "Could not sync drafts" };
  }
}

// Utility function
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    return false;
  }
}
