import { GoogleAuth } from "google-auth-library";

export type GeminiClientConfig =
  | { type: "apiKey"; apiKey: string; model: string }
  | {
      type: "vertex";
      projectId: string;
      location: string;
      model: string;
      keyFilename?: string;
    };

type GenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export class GeminiClient {
  private auth: GoogleAuth | null = null;

  constructor(private config: GeminiClientConfig) {}

  async generateStructuredJson(
    systemInstruction: string,
    userPrompt: string,
    schema: Record<string, unknown>
  ): Promise<string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(await this.getAuthHeaders()),
    };

    const response = await fetch(this.getUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${body.slice(0, 500)}`
      );
    }

    const payload = (await response.json()) as GenerateContentResponse;

    if (payload.error?.message) {
      throw new Error(`Gemini API error: ${payload.error.message}`);
    }

    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("Gemini returned an empty response");
    }

    return content;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (this.config.type === "apiKey") {
      return { "x-goog-api-key": this.config.apiKey };
    }

    if (!this.auth) {
      this.auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        ...(this.config.keyFilename
          ? { keyFilename: this.config.keyFilename }
          : {}),
      });
    }

    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();
    if (!accessToken.token) {
      throw new Error(
        "Failed to obtain Google Cloud access token from service account"
      );
    }

    return { Authorization: `Bearer ${accessToken.token}` };
  }

  private getUrl(): string {
    const model = encodeURIComponent(this.config.model);

    if (this.config.type === "apiKey") {
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    }

    const { projectId, location } = this.config;
    return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  }
}

export function createGeminiClientFromEnv(): GeminiClient | null {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const projectId =
    process.env.GCP_PROJECT_ID?.trim() ??
    process.env.GOOGLE_CLOUD_PROJECT?.trim();
  const location = process.env.GCP_LOCATION?.trim() || "us-central1";
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (credentialsPath && projectId) {
    return new GeminiClient({
      type: "vertex",
      projectId,
      location,
      model,
      keyFilename: credentialsPath,
    });
  }

  if (apiKey) {
    return new GeminiClient({ type: "apiKey", apiKey, model });
  }

  return null;
}
