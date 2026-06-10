import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GearIndigoApiClient } from "../api-client.js";
import { dateOnly, statusLabel, targetShape, toTarget } from "./shared.js";

export function registerListArtifactsTool(server: McpServer): void {
  server.tool(
    "list_artifacts",
    "指定したプロジェクトまたはコードベースの成果物一覧を取得します（既定はコンテンツ抜きの軽量メタデータ）",
    {
      ...targetShape,
      phase: z
        .enum(["requirements", "basic_design", "detailed_design", "testing"])
        .optional()
        .describe("フェーズでフィルタ（プロジェクトのみ。コードベースでは無視）"),
      type: z.string().optional().describe("成果物タイプでフィルタ（例: project_overview）"),
      includeContent: z
        .boolean()
        .optional()
        .describe("コンテンツ本文も含める（トークン消費大。既定は含めない）"),
    },
    async ({ projectId, codebaseId, phase, type, includeContent }) => {
      const client = GearIndigoApiClient.fromEnv();
      const result = await client.listArtifacts(toTarget({ projectId, codebaseId }), {
        phase,
        type,
        includeContent,
      });

      const artifactList = result.artifacts
        .map(
          (a) =>
            `- **${a.title}** (ID: ${a.id})\n  タイプ: ${a.type}\n  ステータス: ${statusLabel(a.status)}\n  バージョン: ${a.version}\n  更新日: ${dateOnly(a.updatedAt)}`
        )
        .join("\n\n");

      const text = [
        `## 成果物一覧 (${result.artifacts.length}件)`,
        ``,
        artifactList || "成果物がありません",
      ].join("\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
