import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GearIndigoApiClient } from "../api-client.js";

export function registerGetProjectTool(server: McpServer): void {
  server.tool(
    "get_project",
    "指定したプロジェクトの詳細情報を取得します",
    {
      projectId: z.string().describe("プロジェクトID"),
    },
    async ({ projectId }) => {
      const client = GearIndigoApiClient.fromEnv();
      const project = await client.getProject(projectId);

      const phaseLabels: Record<string, string> = {
        requirements: "要件定義",
        basic_design: "基本設計",
        detailed_design: "詳細設計",
        testing: "テスト",
        summary: "サマリー",
      };

      const typeLabels: Record<string, string> = {
        new: "新規開発",
        enhance: "既存改修",
      };

      const enhanceTypeLabels: Record<string, string> = {
        full: "フル改修",
        partial: "部分改修",
      };

      const details = [
        `# ${project.name}`,
        "",
        `- **ID**: ${project.id}`,
        `- **タイプ**: ${typeLabels[project.type] || project.type}`,
        project.enhanceType
          ? `- **改修タイプ**: ${enhanceTypeLabels[project.enhanceType] || project.enhanceType}`
          : null,
        `- **フェーズ**: ${phaseLabels[project.phase] || project.phase}`,
        `- **成果物数**: ${project.artifactCount}`,
        `- **作成日**: ${project.createdAt}`,
        `- **更新日**: ${project.updatedAt}`,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: details,
          },
        ],
      };
    }
  );
}
