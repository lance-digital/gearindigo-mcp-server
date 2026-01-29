import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GearIndigoApiClient } from "../api-client.js";

export function registerListArtifactsTool(server: McpServer): void {
  server.tool(
    "list_artifacts",
    "指定したプロジェクトの成果物一覧を取得します",
    {
      projectId: z.string().describe("プロジェクトID"),
      phase: z
        .enum(["requirements", "basic_design", "detailed_design", "testing", "summary"])
        .optional()
        .describe("フェーズでフィルタリング"),
      status: z
        .enum(["draft", "approved", "rejected"])
        .optional()
        .describe("ステータスでフィルタリング"),
    },
    async ({ projectId, phase, status }) => {
      const client = GearIndigoApiClient.fromEnv();
      const result = await client.listArtifacts(projectId, { phase, status });

      const statusLabels: Record<string, string> = {
        draft: "下書き",
        approved: "承認済み",
        rejected: "却下",
      };

      const artifactList = result.artifacts
        .map(
          (a) =>
            `- **${a.title}** (ID: ${a.id})\n  タイプ: ${a.type}\n  ステータス: ${statusLabels[a.status] || a.status}\n  バージョン: ${a.version}\n  更新日: ${a.updatedAt}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `## 成果物一覧 (${result.total}件)\n\nプロジェクトID: ${result.projectId}\n\n${artifactList || "成果物がありません"}`,
          },
        ],
      };
    }
  );
}
