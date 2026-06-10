#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

async function main() {
  // 環境変数チェック（gibiz プラグインと共通の PAT を使う）
  if (!process.env.GIBIZ_API_URL || !process.env.GIBIZ_API_TOKEN) {
    console.error(
      "Error: GIBIZ_API_URL and GIBIZ_API_TOKEN environment variables are required"
    );
    console.error("GIBIZ_API_TOKEN は gibiz プラグインと同じ dg_... PAT を指定できます。");
    process.exit(1);
  }

  const server = createMcpServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // ログは必ず stderr へ（stdout は JSON-RPC 専用）
  console.error("gearindigo-mcp-server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
