import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools/index.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "gear-indigo-biz",
    version: "1.1.0",
  });

  // ツールを登録
  registerTools(server);

  return server;
}
