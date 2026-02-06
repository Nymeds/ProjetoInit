# Migrations after adding Message model

You added a new `Message` model in `prisma/schema.prisma`. To apply it to the database and regenerate Prisma Client, run in the `backend` folder:

```bash
npx prisma migrate dev --name add_messages
npx prisma generate
```

If you're using a different workflow (deploy migrations to a production DB), use the appropriate `prisma migrate` commands for your environment.

Note: This change adds support for messages (group chat and todo comments). After running migrations, the new REST endpoints will be available:

- GET `/groups/:id/messages`
- POST `/groups/:id/messages`
- GET `/todo/:id/comments`
- POST `/todo/:id/comments`
- GET `/todo/:id/chat`
- POST `/todo/:id/chat`

These endpoints require authentication.

Also run the migration to add the new `Message.kind` enum and column:

```bash
npx prisma migrate dev --name add_message_kind
npx prisma generate
```

Make sure `backend/.env` has `DATABASE_URL` set before running migrations.
