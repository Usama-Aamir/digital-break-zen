import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({});

export interface MemeItem {
  id: string;
  title: string;
  text?: string;
  imageUrl?: string;
  postLink?: string;
  subreddit?: string;
  author?: string;
  source: "api" | "fallback";
}

const FALLBACK_MEMES: MemeItem[] = [
  {
    id: "fallback-1",
    title: "When the meeting could have been an email",
    text: "When the meeting could have been an email",
    postLink: "",
    subreddit: "officehumor",
    author: "fallback",
    source: "fallback",
  },
  {
    id: "fallback-2",
    title: "Me opening Slack after 3 minutes of peace",
    text: "Me opening Slack after 3 minutes of peace",
    postLink: "",
    subreddit: "officehumor",
    author: "fallback",
    source: "fallback",
  },
  {
    id: "fallback-3",
    title: "Deadline: tomorrow. Motivation: not found",
    text: "Deadline: tomorrow. Motivation: not found",
    postLink: "",
    subreddit: "officehumor",
    author: "fallback",
    source: "fallback",
  },
  {
    id: "fallback-4",
    title: "Corporate translation: 'Let's circle back' = nobody knows",
    text: "Corporate translation: 'Let's circle back' = nobody knows",
    postLink: "",
    subreddit: "officehumor",
    author: "fallback",
    source: "fallback",
  },
  {
    id: "fallback-5",
    title: "When your coffee is doing more work than the project manager",
    text: "When your coffee is doing more work than the project manager",
    postLink: "",
    subreddit: "officehumor",
    author: "fallback",
    source: "fallback",
  },
];

export interface GetOfficeMemesResponse {
  success: boolean;
  source: "api" | "fallback";
  memes: MemeItem[];
}

/** Fetch office memes from meme-api.com with server-side proxy */
export const getOfficeMemes = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch("https://meme-api.com/gimme/workmemes/50", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("[getOfficeMemes] API response not OK:", response.status, response.statusText);
        return {
          success: true,
          source: "fallback" as const,
          memes: FALLBACK_MEMES,
        };
      }

      const data = (await response.json()) as {
        memes: Array<{
          title: string;
          url: string;
          postLink: string;
          subreddit: string;
          author: string;
          nsfw: boolean;
          spoiler: boolean;
        }>;
      };

      // Filter out unsafe items and normalize
      const normalizedMemes: MemeItem[] = data.memes
        .filter((meme) => !meme.nsfw && !meme.spoiler && meme.url)
        .slice(0, 50)
        .map((meme, index) => ({
          id: `${meme.url}-${index}`,
          title: meme.title || "Office meme",
          imageUrl: meme.url,
          postLink: meme.postLink,
          subreddit: meme.subreddit,
          author: meme.author,
          source: "api" as const,
        }));

      // If no valid memes after filtering, use fallback
      if (normalizedMemes.length === 0) {
        console.warn("[getOfficeMemes] No valid memes after filtering, using fallback");
        return {
          success: true,
          source: "fallback" as const,
          memes: FALLBACK_MEMES,
        };
      }

      return {
        success: true,
        source: "api" as const,
        memes: normalizedMemes,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[getOfficeMemes] Request timeout after 8 seconds");
      } else {
        console.error("[getOfficeMemes] Fetch error:", error);
      }
      
      // Return fallback data on any error - never return empty array
      return {
        success: true,
        source: "fallback" as const,
        memes: FALLBACK_MEMES,
      };
    }
  });
