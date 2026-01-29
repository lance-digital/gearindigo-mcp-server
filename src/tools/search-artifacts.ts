import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GearIndigoApiClient } from "../api-client.js";

export function registerSearchArtifactsTool(server: McpServer): void {
  server.tool(
    "search_artifacts",
    "成果物をキーワードで検索します（タイトルとコンテンツを検索）",
    {
      query: z.string().describe("検索キーワード"),
      projectId: z.string().optional().describe("特定のプロジェクトに限定する場合のプロジェクトID"),
      limit: z.number().optional().describe("取得件数（デフォルト: 20）"),
    },
    async ({ query, projectId, limit }) => {
      const client = GearIndigoApiClient.fromEnv();
      const result = await client.searchArtifacts({ query, projectId, limit });

      const statusLabels: Record<string, string> = {
        draft: "下書き",
        approved: "承認済み",
        rejected: "却下",
      };

      const artifactList = result.artifacts
        .map(
          (a) =>
            `### ${a.title}\n- **ID**: ${a.id}\n- **プロジェクト**: ${a.project.name}\n- **タイプ**: ${a.type}\n- **ステータス**: ${statusLabels[a.status] || a.status}\n- **プレビュー**: ${a.contentPreview}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `## 検索結果: "${result.query}" (${result.total}件)\n\n${artifactList || "該当する成果物がありません"}`,
          },
        ],
      };
    }
  );
}
