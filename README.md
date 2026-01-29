# GEAR.indigo MCP Server

[GEAR.indigo Biz](https://biz.gearindigo.app)で作成した設計ドキュメントにアクセスするための[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) サーバーです。

## 機能

- **list_projects**: プロジェクト一覧の取得
- **get_project**: プロジェクト詳細の取得
- **list_artifacts**: 成果物一覧の取得
- **get_artifact**: 成果物コンテンツの取得
- **search_artifacts**: 成果物のキーワード検索

## セットアップ

### 1. APIキーの取得

1. [GEAR.indigo Biz](https://biz.gearindigo.app)にログイン
2. 設定 → MCP連携 に移動
3. 「APIキーを生成」をクリック
4. 表示されたAPIキーをコピー（一度だけ表示されます）

### 2. MCPクライアントの設定

#### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) または `%APPDATA%\Claude\claude_desktop_config.json` (Windows) に以下を追加:

```json
{
  "mcpServers": {
    "gear-indigo-biz": {
      "command": "npx",
      "args": ["-y", "@gearindigo/mcp-server"],
      "env": {
        "GEAR_INDIGO_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### Cursor

`.cursor/mcp.json` に以下を追加:

```json
{
  "mcpServers": {
    "gear-indigo-biz": {
      "command": "npx",
      "args": ["-y", "@gearindigo/mcp-server"],
      "env": {
        "GEAR_INDIGO_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### Claude Code (CLI)

`~/.claude/settings.json` に以下を追加:

```json
{
  "mcpServers": {
    "gear-indigo-biz": {
      "command": "npx",
      "args": ["-y", "@gearindigo/mcp-server"],
      "env": {
        "GEAR_INDIGO_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

`YOUR_API_KEY` を取得したAPIキーに置き換えてください。

### 3. クライアントを再起動

設定を反映するため、使用しているMCPクライアントを再起動してください。

## 使用例

MCPクライアントで以下のように使用できます：

- 「GEAR.indigoのプロジェクト一覧を見せて」
- 「○○プロジェクトの成果物一覧を取得して」
- 「API仕様書の内容を確認して」
- 「ユーザー認証に関する設計ドキュメントを検索して」

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `GEAR_INDIGO_API_KEY` | ○ | GEAR.indigo BizのAPIキー |
| `GEAR_INDIGO_API_URL` | × | APIのベースURL（デフォルト: `https://biz.gearindigo.app`） |

## ローカル開発

```bash
# 依存関係インストール
npm install

# 開発モードで実行
GEAR_INDIGO_API_KEY=your_key npm run dev

# ビルド
npm run build
```

## ライセンス

MIT
