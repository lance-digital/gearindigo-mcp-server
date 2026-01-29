import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GearIndigoApiClient } from "../api-client.js";

export function registerListProjectsTool(server: McpServer): void {
  server.tool(
    "list_projects",
    "GEAR.indigo Bizのプロジェクト一覧を取得します",
    {
      limit: z.number().optional().describe("取得件数（デフォルト: 50）"),
      offset: z.number().optional().describe("オフセット（ページネーション用）"),
    },
    async ({ limit, offset }) => {
      const client = GearIndigoApiClient.fromEnv();
      const result = await client.listProjects({ limit, offset });

      const phaseLabels: Record<string, string> = {
        requirements: "要件定義",
        basic_design: "基本設計",
        detailed_design: "詳細設計",
        testing: "テスト",
        summary: "サマリー",
      };

      const projectList = result.projects
        .map(
          (p) =>
            `- ${p.name} (ID: ${p.id})\n  フェーズ: ${phaseLabels[p.phase] || p.phase}\n  成果物数: ${p.artifactCount}\n  更新日: ${p.updatedAt}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `## プロジェクト一覧 (${result.total}件)\n\n${projectList || "プロジェクトがありません"}`,
          },
        ],
      };
    }
  );
}
