# Morrow メール認証の設定

新規登録とログインは、メールアドレス＋ワンタイムコードだけです。パスワード・氏名・電話番号は求めません。新規登録だけ `shouldCreateUser: true` とし、ログインからはアカウントを新規作成しません。メールの確認が成功してからアプリに入ります。

## 個人用Supabaseプロジェクト

Morrow専用の個人プロジェクトを使用してください。会社のプロジェクトは使用しません。現在、接続から利用可能なプロジェクトは0件で、本番設定・メール配信・RLSの実環境検証はまだ行えていません。

1. 個人用のMorrowプロジェクトを作成します。
2. SQL Editorで `supabase/migrations/202610170001_planner_states.sql` を実行します。アプリDBにはユーザーIDとプランだけを保存し、メールアドレスは複製しません。
3. AuthでEmailプロバイダーと新規登録、メール確認を有効にします。
4. **Confirm signupとMagic Linkの両方**のメールテンプレートに、下の `{{ .Token }}` を含めます。両方に同じテンプレートを利用できます。
5. OTPの桁数を6〜8桁、有効期限を例として10分、送信間隔を60秒以上に設定し、検証・IPごとのレート制限を設定します。
6. 本番用SMTPを設定します。標準メール送信には宛先・回数の制限があるため、公開利用には独自SMTPが必要です。
7. Site URLをMorrowの本番HTTPS URLに設定します。この実装はコード入力方式のため、OAuthコールバックは不要です。

```html
<h2>morrow.</h2>
<p>確認コード / Your verification code</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>このコードをMorrowの画面に入力してください。心当たりがない場合は、このメールを無視してください。</p>
<p>Enter this code in Morrow. If you did not request it, ignore this email.</p>
```

## 不正送信対策

Cloudflare TurnstileでMorrowの本番ホストを登録します。公開サイトキーをVercelの `TURNSTILE_SITE_KEY` へ、秘密キーをSupabaseのAuth CAPTCHA設定へ保存して検証を有効にします。本番のコード送信にはCAPTCHAを必須としています。Supabase側のレート制限とSMTPの送信上限も設定してください。

## Vercel環境変数

`.env.example` を参照してMorrowのプロジェクトに設定し、再デプロイします。秘密鍵をチャットやGitHubへ貼らないでください。

| 変数 | 値 |
| --- | --- |
| `SUPABASE_URL` | 個人用MorrowプロジェクトURL |
| `SUPABASE_PUBLISHABLE_KEY` | publishableキー。service_roleは使わない |
| `AUTH_APP_ORIGIN` | 本番HTTPSオリジン。末尾にパスを含めない |
| `AUTH_EMAIL_ENABLED` | メール・テンプレート・CAPTCHA設定後 `true` |
| `TURNSTILE_SITE_KEY` | 公開サイトキー。秘密キーはSupabaseだけに保存 |
| `ALLOW_LOCAL_DEMO` | 通常 `false`。認証未設定時に端末内デモを明示的に使う場合だけ `true` |

## 公開前の動作確認

新しいメールアドレスで新規登録→コード入力→プラン保存→ログアウト→同じメールでログイン→プラン復元を確認します。未登録メールでのログインからは新規ユーザーが作成されないこと、誤ったコード・期限切れ・再送制限・セッション失効を確認してください。

異なる2ユーザーで、自分以外のプランを読み書きできないことを実環境で検証します。単体テストだけでは本番のメールやRLSの検証になりません。設定完了まではPRをdraftのまま維持し、稼働中のmainに認証必須の変更を反映しません。

## データの扱い

- セッションはHttpOnly・SameSite=Lax・本番SecureのCookieで管理し、トークンをlocalStorageへ保存しません。
- データAPIは毎回サーバーでユーザーを検証し、そのIDから所有者を決めます。RLSでも自分の行だけを許可します。
- Origin検証、入力サイズ・型の制限、nonce付きCSP、埋め込み防止ヘッダーを設定しています。
- コードやメールをアプリのログ・プランDBに保存しません。認証サービスにはメールアドレスが保存されます。
- 認証未設定時、保護APIは503で拒否します。ブラウザ内の旧データをログインしたアカウントへ自動取り込みしません。
- 複数端末の同時編集は最後の保存が優先されます。

公式資料： https://supabase.com/docs/guides/auth/auth-email-passwordless
