import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GearIndigoApiClient } from "../api-client.js";

export function registerWhoamiTool(server: McpServer): void {
  server.tool(
    "whoami",
    "APIトークンを検証し、認証ユーザー・認証方式・スコープを表示します（401/403 の切り分け用）",
    {},
    async () => {
      const client = GearIndigoApiClient.fromEnv();
      const result = await client.whoami();

      const name = result.user.name || "(名前なし)";
      const scopes = Array.isArray(result.scopes) ? result.scopes.join(", ") : "*";

      const text = [
        `## 認証情報`,
        ``,
        `- **ユーザー**: ${name} <${result.user.email}>`,
        `- **認証方式**: ${result.authMethod}`,
        `- **スコープ**: ${scopes}`,
      ].join("\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
