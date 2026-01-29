import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GearIndigoApiClient } from "../api-client.js";

export function registerGetArtifactTool(server: McpServer): void {
  server.tool(
    "get_artifact",
    "指定した成果物の詳細（コンテンツを含む）を取得します",
    {
      artifactId: z.string().describe("成果物ID"),
    },
    async ({ artifactId }) => {
      const client = GearIndigoApiClient.fromEnv();
      const artifact = await client.getArtifact(artifactId);

      const statusLabels: Record<string, string> = {
        draft: "下書き",
        approved: "承認済み",
        rejected: "却下",
      };

      const header = [
        `# ${artifact.title}`,
        "",
        `- **ID**: ${artifact.id}`,
        `- **タイプ**: ${artifact.type}`,
        `- **ステータス**: ${statusLabels[artifact.status] || artifact.status}`,
        `- **バージョン**: ${artifact.version}`,
        `- **プロジェクト**: ${artifact.project.name} (${artifact.project.id})`,
        `- **更新日**: ${artifact.updatedAt}`,
        "",
        "---",
        "",
      ].join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: header + artifact.content,
          },
        ],
      };
    }
  );
}
