import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GearIndigoApiClient } from "../api-client.js";
import { contentToString, dateOnly, idSchema, statusLabel, targetShape, toTarget } from "./shared.js";

export function registerGetArtifactTool(server: McpServer): void {
  server.tool(
    "get_artifact",
    "指定した成果物の詳細（コンテンツを含む）を取得します。トークン節約のため、まず metadataOnly や summary（小さめの lines）で確認し、必要に応じて全文を取得してください",
    {
      artifactId: idSchema.describe("成果物ID"),
      ...targetShape,
      summary: z.boolean().optional().describe("先頭 N 行のみ取得する（lines 参照）"),
      lines: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .optional()
        .describe("summary 指定時の行数（1〜1000、既定 50）"),
      metadataOnly: z.boolean().optional().describe("コンテンツを除外しメタデータのみ取得する"),
    },
    async ({ artifactId, projectId, codebaseId, summary, lines, metadataOnly }) => {
      const client = GearIndigoApiClient.fromEnv();
      const artifact = await client.getArtifact(toTarget({ projectId, codebaseId }), artifactId, {
        summary,
        lines,
        metadataOnly,
      });

      const headerLines = [
        `# ${artifact.title}`,
        "",
        `- **ID**: ${artifact.id}`,
        `- **タイプ**: ${artifact.type}`,
        `- **ステータス**: ${statusLabel(artifact.status)}`,
        `- **バージョン**: ${artifact.version}`,
        `- **更新日**: ${dateOnly(artifact.updatedAt)}`,
      ];

      if (artifact.truncated) {
        headerLines.push(
          `- **サマリ**: 全 ${artifact.totalLines} 行 / ${artifact.totalChars} 文字のうち先頭部分を表示`
        );
      }

      const content = contentToString(artifact.content);
      const text = [...headerLines, "", "---", "", content].join("\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
