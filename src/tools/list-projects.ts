import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GearIndigoApiClient } from "../api-client.js";
import { dateOnly, phaseLabel } from "./shared.js";

export function registerListProjectsTool(server: McpServer): void {
  server.tool(
    "list_projects",
    "認証ユーザーがアクセスできるプロジェクト一覧を取得します（所属組織のプロジェクト）",
    {},
    async () => {
      const client = GearIndigoApiClient.fromEnv();
      const result = await client.listProjects();

      const projectList = result.projects
        .map((p) => {
          return [
            `- **${p.name}** (ID: ${p.id})`,
            `  フェーズ: ${phaseLabel(p.phase)}`,
            ...(p.codebaseId ? [`  コードベースID: ${p.codebaseId}`] : []),
            `  更新日: ${dateOnly(p.updatedAt)}`,
          ].join("\n");
        })
        .join("\n\n");

      const text = [
        `## プロジェクト一覧 (${result.projects.length}件)`,
        ``,
        projectList || "プロジェクトがありません",
      ].join("\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
