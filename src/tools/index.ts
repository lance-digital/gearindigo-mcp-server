import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWhoamiTool } from "./whoami.js";
import { registerListProjectsTool } from "./list-projects.js";
import { registerListArtifactsTool } from "./list-artifacts.js";
import { registerGetArtifactTool } from "./get-artifact.js";
import { registerSearchArtifactsTool } from "./search-artifacts.js";

export function registerTools(server: McpServer): void {
  registerWhoamiTool(server);
  registerListProjectsTool(server);
  registerListArtifactsTool(server);
  registerGetArtifactTool(server);
  registerSearchArtifactsTool(server);
}
