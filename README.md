# 買い物管理アプリ

家族・グループ（2〜4名想定）で共有する、在庫・消費期限・購入リストの管理PWAです。

## 主な機能

- 在庫管理(数量・保管場所・カテゴリ)
- 消費期限・賞味期限の管理と期限間近アラート
- 購入リストの共有管理(誰がチェックしても全員に反映)
- 追加提案機能(在庫僅少・期限間近・よく買う商品の再購入を自動提案)
- 期限間近のプッシュ通知(Web Push)
- 購入履歴・価格の記録

招待コードを共有するだけで、ログイン不要(匿名認証)でグループに参加できます。

## 技術スタック(すべて無料枠で運用可能)

- [Nuxt 4](https://nuxt.com/)(PWA対応)
- [Supabase](https://supabase.com/)(Postgres + 匿名認証 + Row Level Security)
- [Vercel](https://vercel.com/)(ホスティング + Cron)
- Web Push API(VAPID)

## セットアップ

### 1. Supabaseプロジェクトを作成

1. https://supabase.com で無料プロジェクトを作成
2. SQL Editor で [`supabase/schema.sql`](supabase/schema.sql) の中身を実行
3. **Authentication → Sign In / Providers → Anonymous Sign-ins** を有効化
   (ログインなしでグループに参加する仕組みに必須)
4. **Project Settings → API** から以下を取得し `.env` に設定
   - `NUXT_PUBLIC_SUPABASE_URL`(Project URL)
   - `NUXT_PUBLIC_SUPABASE_KEY`(anon public key)
   - `SUPABASE_SERVICE_ROLE_KEY`(service_role key。**絶対に公開しないこと**)

### 2. Web Push用のVAPIDキー

`.env` には開発用のキーがすでに生成済みですが、本番用に作り直す場合は:

```bash
npx web-push generate-vapid-keys
```

`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`(`mailto:自分のメールアドレス`)を `.env` に設定します。

### 3. ローカル起動

```bash
npm install
npm run dev
```

### 4. Vercelへのデプロイ(無料枠)

1. このリポジトリをGitHubに接続し、Vercelにインポート
2. Vercelの環境変数に `.env` の内容をすべて登録
   (`CRON_SECRET` は任意のランダム文字列。すでに `.env` に生成済みの値があります)
3. `vercel.json` の `crons` 設定により、毎日1回(UTC 23:00 = 日本時間 8:00)期限チェックと通知送信が自動実行されます
   (Vercel Hobbyプランは1日1回までの実行頻度制限がありますが、この設定で収まります)

## iPhoneでプッシュ通知を受け取るには

Safariでアプリを開き、共有ボタン →「ホーム画面に追加」を行ったうえで、アプリ内の設定画面から通知をオンにしてください(iOS 16.4以降が必要。Safariのタブで開いているだけでは通知は届きません)。

## 今後追加できそうな機能(アイデア)

- バーコードスキャンでの商品登録
- レシート撮影からの自動品目登録(OCR)
- 消費ペース学習による、より精度の高い購入提案
- 廃棄記録によるフードロスの可視化
- 定期購入品(消費期限のない消耗品)のリマインド
