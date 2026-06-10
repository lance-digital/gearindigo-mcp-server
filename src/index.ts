#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

async function main() {
  // 環境変数チェック（gibiz プラグインと共通の PAT を使う）
  // GIBIZ_API_URL は未設定なら本番 (https://biz.gearindigo.app) にフォールバックする。
  if (!process.env.GIBIZ_API_TOKEN) {
    console.error("Error: GIBIZ_API_TOKEN environment variable is required");
    console.error("GIBIZ_API_TOKEN は gibiz プラグインと同じ dg_... PAT を指定できます。");
    console.error("自前ホスト時は GIBIZ_API_URL も指定してください（既定: https://biz.gearindigo.app）。");
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
