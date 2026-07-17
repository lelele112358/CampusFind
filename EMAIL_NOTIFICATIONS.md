# Automatic possible-match email notifications

CampusFind can automatically email the owner of a lost-item report after an
administrator enters a found item and a new match reaches the configured score.

## How it works

1. An administrator records a found item.
2. CampusFind calculates and stores new candidate matches.
3. Matches scoring at least `MATCH_EMAIL_THRESHOLD` are sent to the email service.
4. The result is recorded in `item_matches.notification_status` as `Sent`,
   `Skipped`, or `Failed`.
5. A stable idempotency key based on the match ID helps prevent duplicate sends.

Email delivery happens after the SQL transaction commits. A temporary email
failure will not delete the found item or candidate matches.

## Resend setup

1. Create a Resend account.
2. Add and verify a domain you own.
3. Create a sending API key.
4. Add these values locally in `.env` and in Render under **Environment**:

```env
EMAIL_NOTIFICATIONS_ENABLED=true
RESEND_API_KEY=re_your_private_key
EMAIL_FROM="CampusFind <notifications@your-verified-domain.com>"
EMAIL_REPLY_TO=your-contact-address@example.com
APP_URL=https://your-campusfind-service.onrender.com
MATCH_EMAIL_THRESHOLD=58
```

Do not commit a real API key to GitHub.

## Threshold

- `75` sends only high-score matches.
- `58` sends medium and high matches and is the project default.
- `45` sends every stored candidate, including low-score matches.

A higher threshold reduces false alerts and email volume.

## Testing

For a safe provider-level delivery test, use a Resend test recipient such as
`delivered@resend.dev`. To send to normal student addresses, the sender must use
a domain verified in the Resend account.

## Privacy

The message includes only the report reference, item category, and date found.
It does not include private verification notes, serial numbers, uploaded files,
or sensitive ownership details.
