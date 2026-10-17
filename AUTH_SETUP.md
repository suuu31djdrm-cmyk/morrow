# Morrow 認証の本番設定

コードの実装と、認証サービスの有効化は別です。この手順を完了するまでは実ログインできません。秘密鍵をチャットやGitHubへ貼らないでください。

## 1. 個人用Supabaseプロジェクト

Morrow専用の個人プロジェクトを用意します。会社のプロジェクトは使用しません。

SQL Editorで `supabase/migrations/202610170001_planner_states.sql` を実行します。ユーザーIDとプランだけを保存し、メールアドレス・電話番号・氏名・画像はアプリのテーブルに複製しません。RLSは自分の行だけの読み書きを許可します。管理用service_roleキーはアプリで使いません。

公開前に必ず、異なる2ユーザーでログインし、他方のデータを読み書きできないことを確認してください。このリポジトリの単体テストだけでは、本番のRLSやプロバイダー設定の検証にはなりません。

## 2. Vercel環境変数

`.env.example` を参照し、Vercelの対象プロジェクトだけに設定します。

| 変数 | 値 |
| --- | --- |
| `SUPABASE_URL` | プロジェクトURL |
| `SUPABASE_PUBLISHABLE_KEY` | publishableキー。service_roleキーを使わない |
| `AUTH_APP_ORIGIN` | 固定した本番HTTPSオリジン。例：`https://morrow.example` |
| `AUTH_GOOGLE_ENABLED` | Googleの設定後に `true` |
| `AUTH_LINE_ENABLED` | LINEの設定後に `true` |
| `AUTH_EMAIL_ENABLED` | SMTP・OTP・CAPTCHA設定後に `true` |
| `AUTH_SMS_ENABLED` | SMS配信・OTP・CAPTCHA設定後に `true` |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstileの公開サイトキー |
| `ALLOW_LOCAL_DEMO` | 通常は `false`。認証未設定時に端末内デモを明示的に使う場合のみ `true` |

SUPABASEの2項目もサーバーだけで使用します。ブラウザへ認証トークンや秘密鍵を渡す実装はありません。クライアントに返すのは認証状態・内部ユーザーID・ログイン方法の有効状態・CAPTCHA公開キーです。

SupabaseのURL Configurationで、Site URLを本番オリジンにし、Redirect URLsに **完全一致の** `https://YOUR_APP/api/auth/callback` を登録します。広いワイルドカードは使わないでください。開発用localhostは別に登録します。

## 3. Google

Google CloudでWeb用OAuthクライアントを作り、Supabaseが示すcallback URLをGoogle側へ登録。Client IDとClient SecretはSupabaseのGoogleプロバイダー設定に保存します。Morrowは `openid email` を要求し、アプリDBには連絡先を複製しません。公開アプリには同意画面・ドメイン・プライバシーポリシー等の準備も必要です。

## 4. LINE

LINE DevelopersでWeb用LINE Loginチャネルを用意します。SupabaseのCustom OAuth/OIDC providerとして **`custom:line`** を設定します。

- PKCEを有効のままにする。
- OAuth2の手動設定を使う場合：Authorization URL `https://access.line.me/oauth2/v2.1/authorize`、Token URL `https://api.line.me/oauth2/v2.1/token`、UserInfo URL `https://api.line.me/oauth2/v2.1/userinfo`。
- scopeは `openid`。`email_optional` を有効にし、不要なプロフィールやメール情報を要求しない。
- LINE側のcallbackはSupabaseが表示するURLをそのまま登録。
- Channel IDとChannel SecretはSupabaseへ保存。Morrowへは配置しない。
- チャネルの開発中／公開状態、テスト可能ユーザーの設定も確認する。

異なるログイン方法で別アカウントが作られる場合があります。本人確認なしで、メールが似ている等の理由でアカウントを勝手に統合しません。

## 5. メールのワンタイムコード

SupabaseのEmailプロバイダーと本番SMTPを設定します。メールテンプレートには `{{ .Token }}` を使用し、リンクではなくコードを送信。アプリは6〜8桁の数字を受け付けます。サービス側のOTP長もこの範囲に合わせてください。有効期限は短め（例：10分）、再送間隔・検証試行回数・IP等のレート制限をSupabase側で設定してください。コードをログへ出さないでください。

## 6. SMSのワンタイムコード

SupabaseのPhoneプロバイダーでTwilio等のSMS配信を設定します。送信元、送信先国、利用上限、課金アラートを確認してください。電話番号は国番号付きE.164形式です。SMSの有効期限も短くし、再送・検証回数を制限します。SMSには配信費用がかかります。SMS OTPは多要素認証そのものではありません。

## 7. CAPTCHAと不正送信対策

Cloudflare Turnstileで本番ホストを登録し、公開キーをVercelの `TURNSTILE_SITE_KEY` へ、秘密キーをSupabaseのAuth CAPTCHA設定へ登録します。SupabaseでCAPTCHA検証を必ず有効化してください。アプリは本番のOTP送信でCAPTCHAトークンを必須にしますが、実際の検証はSupabaseが行います。Supabaseのレート制限・OTP期限・SMTP/SMS利用上限も併用してください。

## 8. 検証してから公開

Google、LINE、メールコード、SMSコードをそれぞれ実機でテストします。誤ったコード・期限切れ・再送制限・ログアウト・期限切れセッション・別ユーザーのデータ分離も確認します。これらは認証情報がないローカル環境では検証できていません。

認証設定がない場合はログイン画面で未設定と表示し、保護データAPIは503で拒否します。ログイン前のブラウザ内データを、別ユーザーのクラウドデータへ自動取り込みしません。既存の端末内データは消しません。

## セキュリティ設計と限界

- HttpOnly・SameSite=Lax・本番SecureのCookie。トークンをlocalStorageに保存しない。
- サーバーで毎回ユーザーを検証し、Cookie内の未検証情報を認可に使わない。
- 所有者は入力値ではなく、検証したログインユーザーIDから決定する。
- 更新APIはOriginを検証し、サイズとデータ型を制限する。
- nonce付きCSP、埋め込み防止、Referrer制限、HTTPS用ヘッダー。
- パスワードやOTPをアプリDBに保存せず、アプリのエラーに個人情報やサービス内部情報を出さない。
- Supabase Auth自体には認証に必要なメールアドレス・電話番号等が保存される。漏えいリスクをゼロとは保証しない。
- 管理者アカウントのMFA、アクセス権の最小化、監査・更新・バックアップ・削除方針も運用側で必要。
- 複数端末の同時編集は後の保存が優先される。競合マージは未実装。

公式資料：

- https://supabase.com/docs/guides/auth/custom-oauth-providers
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/phone-login
- https://developers.line.biz/en/docs/line-login/integrate-line-login/
