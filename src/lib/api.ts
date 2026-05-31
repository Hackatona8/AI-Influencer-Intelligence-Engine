export type TrendTopic = {
  id: string;
  title: string;
  category: string;
  trendScore: number;
  insight: string;
};

export type GenerateResponse = {
  success: boolean;
  postId: string;
  topicId: string;
  assets: {
    reelScript: boolean;
    instagramCaption: boolean;
    linkedinPost: boolean;
  };
  message: string;
  content?: {
    reel_script?: string;
    linkedin_post?: string;
    instagram_caption?: string;
  } | null;
};

export type ApprovalStatus = "approved" | "rejected";

export type ApprovalResponse = {
  success: boolean;
  postId: string;
  status: ApprovalStatus;
  message: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Client-side helpers for the FastAPI mock backend.
const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("API request failed", response.status, text);
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Network error calling API", error);
    throw error;
  }
};

export const fetchTrendingTopics = async (): Promise<TrendTopic[]> => {
  return request<TrendTopic[]>("/api/trends");
};

export const generateContent = async (topicId: string): Promise<GenerateResponse> => {
  return request<GenerateResponse>("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic_id: topicId }),
  });
};

export const updateApprovalStatus = async (
  postId: string,
  status: ApprovalStatus,
): Promise<ApprovalResponse> => {
  return request<ApprovalResponse>("/api/approve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ post_id: postId, status }),
  });
};
