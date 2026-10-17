# Morrow メールアドレス＋パスワード認証

新規登録とログインは、メールアドレスとパスワードだけです。Auth0・Google・LINE・SMS・ワンタイムコードの設定は不要です。Supabase Authの `signUp` と `signInWithPassword` をサーバーから使用します。

## 現在の状態

個人用Morrowプロジェクト `szsuwouwdugnigufojpn` にプラン保存テーブルを作成済みです。RLSと所有者限定のSELECT/INSERT/UPDATE/DELETEポリシー、未ログイン役への権限がないことをSQLで確認し、Security Advisorの指摘は0件でした。実ユーザー2人でのデータ分離・実ログインは未検証です。

## Supabase設定

Authentication → Sign In / Providersで、Emailと新規ユーザー登録を有効にします。パスワードの最低文字数を12に合わせます。アプリでも12文字以上・UTF-8で72バイト以内を検証します。

**Confirm emailをオンにする場合**：登録後の確認メールが必要です。標準メール送信はSupabaseプロジェクトのチームメンバー宛てに制限されるため、一般公開には独自SMTPを設定してください。Confirm signupメールはリンク形式のまま使用します。以前のコード用テンプレートへ変更した場合は `{{ .ConfirmationURL }}` の確認リンクに戻してください。Magic Linkテンプレートはこの認証方式では使用しません。

メール確認が必要な登録では、セッションがない間はアプリに入れず、確認メールの案内を表示します。確認済みアカウントへの重複登録も同じ案内にし、アカウントの存在を明示しません。

**Confirm emailをオフにする場合**：メール配信なしで登録後すぐログインできます。ただしメールアドレスの所有者は検証されません。個人用試作でメール送信を省く場合に選べる設定です。公開時の推奨はメール確認オンです。アプリからこの設定を勝手に変更しません。

Authentication → URL Configuration：

- Site URL：`https://morrow-ten-nu.vercel.app`
- Redirect URLs：`https://morrow-ten-nu.vercel.app/api/auth/callback`

固定オリジンへのPKCEコールバックだけを使用し、入力された任意の戻り先URLは受け付けません。実際の公開URLを変える場合は環境変数とここを両方変更します。

## Vercel環境変数

MorrowプロジェクトのSettings → Environment Variablesに設定し、再デプロイします。

| 変数 | 値 |
| --- | --- |
| `SUPABASE_URL` | 個人用MorrowプロジェクトのURL |
| `SUPABASE_PUBLISHABLE_KEY` | publishableキー。service_roleを使わない |
| `AUTH_APP_ORIGIN` | `https://morrow-ten-nu.vercel.app` |
| `AUTH_EMAIL_ENABLED` | `true` |
| `ALLOW_LOCAL_DEMO` | `false` |
| `TURNSTILE_SITE_KEY` | 任意。CAPTCHA使用時だけ設定 |

CAPTCHAを使う場合は秘密キーと検証の有効化をSupabase側でも設定します。公開キーがある場合、アプリは登録・ログインにCAPTCHAトークンを要求します。CAPTCHA未使用の場合もSupabase側のログイン・登録のレート制限は設定してください。

## セキュリティと確認

- パスワードは認証リクエストでSupabase Authへ渡します。アプリのDB・localStorage・ログには保存しません。メールもプランDBに複製しません。
- セッションはHttpOnly・SameSite=Lax・本番SecureのCookieで管理します。
- データAPIは毎回ユーザーをサーバーで検証し、そのIDを所有者とします。RLSでも制限します。
- 更新APIにはOrigin検証、型・サイズの制限、ページにはnonce付きCSPなどを設定しています。
- 新規登録、ログアウト、再ログイン、プラン復元、誤ったパスワード、メール未確認、別ユーザーの分離を実機で検証してからPRを公開します。
- パスワード再設定画面は今回の実装範囲に含めていません。一般公開前に追加が必要です。
- 旧ブラウザデータをログイン先へ自動取り込みしません。同時編集は最後の保存が優先されます。

公式資料： https://supabase.com/docs/guides/auth/passwords
