# CampusFind email notification update

This version adds automatic possible-match emails without adding another npm
package. Node.js 20's built-in `fetch` sends requests to the Resend Email API.

## Changed files

- `src/services/emailService.js` — new email configuration, safe HTML template,
  Resend request, timeout, and idempotency key.
- `src/services/matchingService.js` — sends notifications after the SQL
  transaction commits.
- `src/repositories/matchRepository.js` — records delivery results.
- `src/controllers/foundItemController.js` — returns email counts to the admin UI.
- `public/assets/js/admin.js` — displays send counts and per-match email status.
- `database/01_schema.sql` — adds notification audit columns to `item_matches`.
- `.env.example`, Render Blueprints, README, and SQL examples — configuration
  and documentation updates.
- `tests/email.test.js` — checks threshold defaults and prevents private notes
  from appearing in email content.

## After replacing your project files

```bash
cd /Users/sonbui/Documents/CampusFind
npm test
git add .
git commit -m "Add automatic match email notifications"
git push origin main
```

The next Render deployment automatically applies the new PostgreSQL columns.
Then add the email environment variables described in `EMAIL_NOTIFICATIONS.md`.
