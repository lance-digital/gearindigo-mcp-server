import { z } from "zod";
import type { ArtifactTarget } from "../api-client.js";

/**
 * ID 形式の制約。URL パスに直接埋め込むため、パス区切りや
 * パーセントエンコードを含む値（path traversal）を拒否する。
 */
export const idSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/, "IDは英数字・ハイフン・アンダースコアのみ使用できます");

/**
 * 全ツール共通: 成果物の所属先（projectId か codebaseId のどちらか一方）を表す引数。
 */
export const targetShape = {
  projectId: idSchema
    .optional()
    .describe("プロジェクトID（projectId か codebaseId のどちらか一方を指定）"),
  codebaseId: idSchema
    .optional()
    .describe("コードベースID（projectId か codebaseId のどちらか一方を指定）"),
};

export function toTarget(args: { projectId?: string; codebaseId?: string }): ArtifactTarget {
  return { projectId: args.projectId, codebaseId: args.codebaseId };
}

/** ステータスの日本語ラベル（project: draft/approved/changes_requested, codebase: draft/accepted）。 */
const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  approved: "承認済み",
  changes_requested: "修正依頼",
  accepted: "確定",
  rejected: "却下",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/** content が文字列でなければ JSON 文字列化する（codebase 成果物は JSON）。 */
export function contentToString(content: unknown): string {
  if (content === null || content === undefined) return "";
  return typeof content === "string" ? content : JSON.stringify(content, null, 2);
}

const PHASE_LABELS: Record<string, string> = {
  requirements: "要件定義",
  basic_design: "基本設計",
  detailed_design: "詳細設計",
  testing: "テスト",
};

export function phaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase;
}

/** ISO 日時の先頭 10 文字 (YYYY-MM-DD)。 */
export function dateOnly(value: string | undefined): string {
  return (value ?? "").slice(0, 10);
}
