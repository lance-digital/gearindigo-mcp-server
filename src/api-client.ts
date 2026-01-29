const DEFAULT_API_URL = "https://biz.gearindigo.app";

interface ApiClientConfig {
  apiKey: string;
  apiUrl: string;
}

export class GearIndigoApiClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(config: ApiClientConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl.replace(/\/$/, ""); // 末尾のスラッシュを除去
  }

  static fromEnv(): GearIndigoApiClient {
    const apiKey = process.env.GEAR_INDIGO_API_KEY;
    if (!apiKey) {
      throw new Error("GEAR_INDIGO_API_KEY environment variable is required");
    }

    const apiUrl = process.env.GEAR_INDIGO_API_URL || DEFAULT_API_URL;

    return new GearIndigoApiClient({ apiKey, apiUrl });
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.apiUrl}/api/mcp/v1${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  // プロジェクト一覧取得
  async listProjects(params?: { limit?: number; offset?: number }): Promise<{
    projects: Array<{
      id: string;
      name: string;
      type: string;
      phase: string;
      createdAt: string;
      updatedAt: string;
      artifactCount: number;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const query = searchParams.toString();
    return this.request(`/projects${query ? `?${query}` : ""}`);
  }

  // プロジェクト詳細取得
  async getProject(projectId: string): Promise<{
    id: string;
    name: string;
    type: string;
    phase: string;
    enhanceType: string | null;
    createdAt: string;
    updatedAt: string;
    artifactCount: number;
  }> {
    return this.request(`/projects/${projectId}`);
  }

  // 成果物一覧取得
  async listArtifacts(
    projectId: string,
    params?: { phase?: string; status?: string }
  ): Promise<{
    projectId: string;
    artifacts: Array<{
      id: string;
      type: string;
      title: string;
      status: string;
      version: number;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.phase) searchParams.set("phase", params.phase);
    if (params?.status) searchParams.set("status", params.status);

    const query = searchParams.toString();
    return this.request(`/projects/${projectId}/artifacts${query ? `?${query}` : ""}`);
  }

  // 成果物詳細取得
  async getArtifact(artifactId: string): Promise<{
    id: string;
    type: string;
    title: string;
    content: string;
    status: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    project: {
      id: string;
      name: string;
    };
  }> {
    return this.request(`/artifacts/${artifactId}`);
  }

  // 成果物検索
  async searchArtifacts(params: {
    query: string;
    projectId?: string;
    limit?: number;
  }): Promise<{
    artifacts: Array<{
      id: string;
      type: string;
      title: string;
      status: string;
      version: number;
      createdAt: string;
      updatedAt: string;
      project: {
        id: string;
        name: string;
      };
      contentPreview: string;
    }>;
    total: number;
    query: string;
  }> {
    const searchParams = new URLSearchParams();
    searchParams.set("query", params.query);
    if (params.projectId) searchParams.set("projectId", params.projectId);
    if (params.limit) searchParams.set("limit", params.limit.toString());

    return this.request(`/artifacts/search?${searchParams.toString()}`);
  }
}
