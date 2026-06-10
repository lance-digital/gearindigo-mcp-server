import { readFileSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools/index.js";

/**
 * パッケージのバージョンを package.json から読む（ハードコードを避け、
 * npm version でのバージョン上げと自動的に同期させる）。
 * CommonJS 出力のため __dirname を使う。src/server.ts（dev）・
 * dist/server.js（build）のどちらもパッケージルート直下の 1 階層下に
 * あるため ../package.json で解決できる。
 */
function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "gear-indigo-biz",
    version: readVersion(),
  });

  // ツールを登録
  registerTools(server);

  return server;
}
