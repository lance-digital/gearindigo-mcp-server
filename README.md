# GEAR.indigo MCP Server

[GEAR.indigo Biz](https://biz.gearindigo.app) で作成した設計ドキュメント（成果物）にアクセスするための [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) サーバーです。

GEAR.indigo Biz の `/api/v1` REST API を Personal Access Token (PAT) で叩く薄いクライアントで、
[`gibiz` Claude Code プラグイン](https://github.com/lance-digital)（bash CLI）と **同じ API・同じトークン** を使います。
プラグイン用に発行した `dg_...` トークン（`GIBIZ_API_TOKEN`）をそのまま流用できます。

## 機能

- **whoami**: トークン検証・認証ユーザー / スコープの確認（401/403 の切り分け用）
- **list_artifacts**: 成果物一覧の取得（既定はコンテンツ抜きの軽量メタデータ）
- **get_artifact**: 成果物コンテンツの取得（`summary` / `metadataOnly` でトークン節約可能）
- **search_artifacts**: 成果物のキーワード全文検索（マッチ箇所のスニペット返却）

プロジェクト・コードベースの両方に対応します（`projectId` か `codebaseId` のどちらかを指定）。

## セットアップ

### 1. Personal Access Token の取得

[GEAR.indigo Biz](https://biz.gearindigo.app) の `/settings/api-tokens` で PAT を発行してください。
**発行直後の平文トークン（`dg_...` 43文字）は一度しか表示されません。**
既に `gibiz` プラグイン用に発行済みであれば、そのトークンをそのまま使えます。

> スコープは `read`（一覧 / 取得 / 検索）のみ。レビュー投稿はセキュリティ上 PAT からは実行できません。

### 2. MCP クライアントの設定

本番（[biz.gearindigo.app](https://biz.gearindigo.app)）を使う場合は `GIBIZ_API_TOKEN`（PAT）だけで動きます。
`GIBIZ_API_URL` は未設定なら `https://biz.gearindigo.app` にフォールバックします（自前ホスト時のみ指定）。

#### Claude Code (CLI)

```bash
claude mcp add --transport stdio \
  --env GIBIZ_API_TOKEN=dg_xxxxxxxx \
  --scope user \
  gear-indigo-biz -- npx -y @lance-digital/gearindigo-mcp-server
```

#### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) または
`%APPDATA%\Claude\claude_desktop_config.json` (Windows) に追加:

```json
{
  "mcpServers": {
    "gear-indigo-biz": {
      "command": "npx",
      "args": ["-y", "@lance-digital/gearindigo-mcp-server"],
      "env": {
        "GIBIZ_API_TOKEN": "YOUR_PAT"
      }
    }
  }
}
```

> 自前ホストや検証環境に向ける場合は `env` に `"GIBIZ_API_URL": "https://<your-deployment>"` を追加してください。

#### Cursor

`.cursor/mcp.json` に上記 `mcpServers` と同じ内容を追加してください。

### 3. クライアントを再起動

設定を反映するため、使用している MCP クライアントを再起動してください。

## 使用例

- 「GEAR.indigo の認証を確認して」（whoami）
- 「プロジェクト `<projectId>` の成果物一覧を見せて」
- 「成果物 `<artifactId>` の中身を要約して」（summary）
- 「`<projectId>` でユーザー認証に関する記述を検索して」

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `GIBIZ_API_TOKEN` | ○ | Personal Access Token (`dg_...`)。gibiz プラグインと共通。**環境変数経由のみ**（argv に出さない） |
| `GIBIZ_API_URL` | × | デプロイ先のベース URL（既定: `https://biz.gearindigo.app`）。`https://` は任意ホスト、`http://` は loopback (`localhost` / `127.0.0.1` / `::1`) のみ許可 |

## トークン節約のコツ

1. `list_artifacts` で何があるか把握
2. `search_artifacts` でキーワードから当たりを付ける
3. `get_artifact` を `metadataOnly` → `summary`(`lines: 50`) → `summary`(`lines: 200`) → 全文 の順で

## ローカル開発

```bash
npm install                         # 依存インストール
npm run typecheck                   # 型チェック
npm run test:run                    # テスト
npm run build                       # dist/ にビルド

# 動作確認（stderr に "running on stdio" が出れば OK）
GIBIZ_API_URL=http://localhost:3000 GIBIZ_API_TOKEN=dg_... npm run dev
```

## ライセンス

MIT
