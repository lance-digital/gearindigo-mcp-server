import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListProjectsTool } from "./list-projects.js";
import { registerGetProjectTool } from "./get-project.js";
import { registerListArtifactsTool } from "./list-artifacts.js";
import { registerGetArtifactTool } from "./get-artifact.js";
import { registerSearchArtifactsTool } from "./search-artifacts.js";

export function registerTools(server: McpServer): void {
  registerListProjectsTool(server);
  registerGetProjectTool(server);
  registerListArtifactsTool(server);
  registerGetArtifactTool(server);
  registerSearchArtifactsTool(server);
}
