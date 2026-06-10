import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GearIndigoApiClient } from "../api-client.js";
import { statusLabel, targetShape, toTarget } from "./shared.js";

export function registerSearchArtifactsTool(server: McpServer): void {
  server.tool(
    "search_artifacts",
    "プロジェクトまたはコードベースの成果物をキーワード全文検索し、マッチ箇所のスニペット（前後3行）を返します",
    {
      query: z.string().min(1).max(500).describe("検索キーワード（1〜500文字、大小文字区別なし）"),
      ...targetShape,
      phase: z
        .enum(["requirements", "basic_design", "detailed_design", "testing"])
        .optional()
        .describe("フェーズでフィルタ（プロジェクトのみ。コードベースでは無視）"),
      type: z.string().optional().describe("成果物タイプでフィルタ"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("最大結果数（1〜50、既定 10）"),
    },
    async ({ query, projectId, codebaseId, phase, type, maxResults }) => {
      const client = GearIndigoApiClient.fromEnv();
      const result = await client.searchArtifacts(toTarget({ projectId, codebaseId }), {
        query,
        phase,
        type,
        maxResults,
      });

      const resultBlocks = result.results
        .map((r) => {
          const snippets = r.snippets
            .map((s) => `  - L${s.lineNumber}: ${s.text}`)
            .join("\n");
          return `### ${r.title}\n- **ID**: ${r.id}\n- **タイプ**: ${r.type}\n- **ステータス**: ${statusLabel(r.status)}\n- **バージョン**: ${r.version}\n- **マッチ箇所**:\n${snippets || "  （スニペットなし）"}`;
        })
        .join("\n\n");

      const text = [
        `## 検索結果: "${query}" (${result.total}件)`,
        ``,
        resultBlocks || "該当する成果物がありません",
      ].join("\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
