/**
 * GEAR.indigo Biz の v1 REST API クライアント。
 *
 * gibiz Claude Code プラグイン（bash CLI）と同じ /api/v1 エンドポイントを、
 * 同じ Personal Access Token (dg_...) で叩く。環境変数も gibiz と共通の
 * GIBIZ_API_URL / GIBIZ_API_TOKEN を使うため、プラグイン用の設定をそのまま流用できる。
 */

/** 成果物の所属先。projectId と codebaseId はどちらか一方のみ指定する。 */
export interface ArtifactTarget {
  projectId?: string;
  codebaseId?: string;
}

interface ApiClientConfig {
  apiUrl: string;
  apiToken: string;
}

/** API URL のスキーム・ホストを検査する（bin/gibiz の check_config 相当）。 */
export function validateApiUrl(apiUrl: string): void {
  const schemeMatch = apiUrl.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
  if (!schemeMatch) {
    throw new Error(`Invalid GIBIZ_API_URL: must start with https:// or http:// (got: ${apiUrl})`);
  }
  const scheme = schemeMatch[1].toLowerCase();
  if (scheme !== "https" && scheme !== "http") {
    throw new Error(`Invalid GIBIZ_API_URL scheme: ${scheme} (must be https or http://localhost)`);
  }

  const rest = apiUrl.slice(schemeMatch[0].length);
  const authority = rest.split(/[/?#]/, 1)[0];
  if (authority.length === 0) {
    throw new Error("Invalid GIBIZ_API_URL: host is required");
  }
  if (authority.includes("@")) {
    throw new Error("GIBIZ_API_URL userinfo (user:pass@host) is not allowed for security reasons.");
  }

  let host: string;
  if (authority.startsWith("[")) {
    host = authority.slice(1, authority.indexOf("]"));
  } else {
    host = authority.split(":", 1)[0];
  }

  if (scheme === "http") {
    const loopback = new Set(["localhost", "127.0.0.1", "::1"]);
    if (!loopback.has(host)) {
      throw new Error(
        "Plain HTTP is only allowed for loopback hosts (localhost / 127.0.0.1 / ::1). Use HTTPS."
      );
    }
  }
}

export class GearIndigoApiClient {
  private apiUrl: string;
  private apiToken: string;
  private fetchFn: typeof fetch;

  constructor(config: ApiClientConfig, fetchFn: typeof fetch = fetch) {
    validateApiUrl(config.apiUrl);
    this.apiUrl = config.apiUrl.replace(/\/+$/, ""); // 末尾のスラッシュを除去
    this.apiToken = config.apiToken;
    this.fetchFn = fetchFn;
  }

  /** 環境変数 (GIBIZ_API_URL / GIBIZ_API_TOKEN) から生成する。 */
  static fromEnv(): GearIndigoApiClient {
    const apiUrl = process.env.GIBIZ_API_URL?.trim();
    const apiToken = process.env.GIBIZ_API_TOKEN?.trim();

    if (!apiUrl) {
      throw new Error("GIBIZ_API_URL environment variable is required");
    }
    if (!apiToken) {
      throw new Error("GIBIZ_API_TOKEN environment variable is required");
    }

    return new GearIndigoApiClient({ apiUrl, apiToken });
  }

  /**
   * GET リクエストを送り JSON を返す。
   * トークンは Authorization: Bearer ヘッダ経由のみ（argv に出さない）。
   */
  private async request<T>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = new URL(`${this.apiUrl}/api/v1${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    let response: Response;
    try {
      response = await this.fetchFn(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Connection failed: ${reason}`);
    }

    const bodyText = await response.text();
    if (response.ok) {
      return (bodyText.length > 0 ? JSON.parse(bodyText) : {}) as T;
    }
    throw this.toError(response.status, bodyText);
  }

  /** HTTP ステータスを分かりやすいエラーに変換する（bin/gibiz の api_call 相当）。 */
  private toError(status: number, bodyText: string): Error {
    const serverMessage = extractErrorMessage(bodyText);
    switch (status) {
      case 401:
        return new Error("Authentication failed. Check your GIBIZ_API_TOKEN (a dg_... PAT).");
      case 403:
        return new Error("Permission denied. The token lacks access to this resource.");
      case 404:
        return new Error("Resource not found.");
      case 400:
        return new Error(`Bad request: ${serverMessage ?? "Invalid input"}`);
      case 429:
        return new Error("Too many requests. Wait and try again (rate limited).");
      default:
        return new Error(`Server error (HTTP ${status}): ${serverMessage ?? "Unknown error"}`);
    }
  }

  /** target の projectId / codebaseId からベースパスを決める（排他検証つき）。 */
  private basePath(target: ArtifactTarget): string {
    const hasProject = !!target.projectId;
    const hasCodebase = !!target.codebaseId;
    if (hasProject === hasCodebase) {
      throw new Error("Provide exactly one of projectId or codebaseId.");
    }
    return hasProject
      ? `/projects/${target.projectId}`
      : `/codebases/${target.codebaseId}`;
  }

  // 認証確認
  async whoami(): Promise<{
    user: { id: string; email: string; name: string | null };
    scopes: string[] | null;
    authMethod: string;
  }> {
    return this.request("/whoami");
  }

  // 成果物一覧取得
  async listArtifacts(
    target: ArtifactTarget,
    params?: { phase?: string; type?: string; includeContent?: boolean }
  ): Promise<{
    artifacts: Array<{
      id: string;
      type: string;
      title: string;
      status: string;
      version: number;
      updatedAt: string;
      createdAt?: string;
      content?: unknown;
    }>;
  }> {
    return this.request(`${this.basePath(target)}/artifacts`, {
      phase: params?.phase,
      type: params?.type,
      include: params?.includeContent ? "content" : undefined,
    });
  }

  // 成果物詳細取得
  async getArtifact(
    target: ArtifactTarget,
    artifactId: string,
    params?: { summary?: boolean; lines?: number; metadataOnly?: boolean }
  ): Promise<{
    id: string;
    type: string;
    title: string;
    status: string;
    version: number;
    updatedAt: string;
    content?: unknown;
    truncated?: boolean;
    totalLines?: number;
    totalChars?: number;
  }> {
    return this.request(`${this.basePath(target)}/artifacts/${artifactId}`, {
      summary: params?.summary ? "true" : undefined,
      lines: params?.summary && params.lines !== undefined ? params.lines : undefined,
      "metadata-only": params?.metadataOnly ? "true" : undefined,
    });
  }

  // 成果物検索（スニペット返却）
  async searchArtifacts(
    target: ArtifactTarget,
    params: { query: string; phase?: string; type?: string; maxResults?: number }
  ): Promise<{
    results: Array<{
      id: string;
      type: string;
      title: string;
      version: number;
      status: string;
      updatedAt: string;
      snippets: Array<{ lineNumber: number; text: string }>;
    }>;
    total: number;
  }> {
    return this.request(`${this.basePath(target)}/artifacts/search`, {
      q: params.query,
      phase: params.phase,
      type: params.type,
      max: params.maxResults,
    });
  }
}

/** レスポンスボディ JSON から { error } / { message } を取り出す。失敗時は null。 */
function extractErrorMessage(bodyText: string): string | null {
  if (!bodyText) return null;
  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;
    if (typeof parsed.error === "string") return parsed.error;
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    // JSON でない（HTML エラーページ等）場合は無視
  }
  return null;
}
