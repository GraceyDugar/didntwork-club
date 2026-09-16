# didntwork.club

**A public wall of failed startup stories from Bengaluru founders.**
Post what you built, why it died, and your handle. It's cheaper than therapy.

🔗 Live: [didntwork.club](https://didntwork.club)

---

## Why

Bengaluru has a directory for everyone who is *building* something. Nobody keeps the list of what didn't work — even though that's where most of the lessons are. This is that list. Founders submit a one-liner, a short honest reason, and (optionally) their X/LinkedIn so the post doubles as a small bit of visibility for them.

## How it works

1. A visitor fills the form on the homepage (one-liner, what happened, year, name or anonymous, socials, optional screenshot).
2. The story lands in the database with `status = pending`. Nothing is public yet.
3. The admin logs in at `/admin`, reads the queue, and hits **Approve** or **Reject**.
4. Approved stories appear on the wall instantly, with the founder's handle linked.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Front end | Vanilla HTML / CSS / JS, no build step | Fast to ship, nothing to maintain |
| Database & auth | [Supabase](https://supabase.com) (Postgres + Row Level Security) | Free tier, real auth, security rules live in the DB not the client |
| Images | Supabase Storage (public bucket, 2 MB cap, images only) | Client-side compression before upload |
| Hosting | [Vercel](https://vercel.com) | Git push → deploy, free SSL, built-in analytics |

## Security model

- Anonymous visitors can **insert** stories only with `status = 'pending'`, and can **read** only `approved` rows — enforced by RLS policies, not by the front end.
- Only an authenticated user can read pending/rejected rows, update status, or delete. Public sign-ups are disabled in Supabase Auth, so exactly one admin account exists.
- The publishable key in `config.js` is designed to be public; it grants nothing the RLS policies don't allow.

## Project structure

```
index.html   # landing page + story wall + submission form
admin.html   # login + moderation queue (served at /admin)
app.js       # public page logic: load approved stories, submit new ones
style.css    # design system, stickers, cards, responsive rules
config.js    # Supabase URL + publishable key, UPI id
schema.sql   # tables, policies, storage bucket
vercel.json  # clean URLs
```

## Running it yourself

1. Create a Supabase project and run `schema.sql` in the SQL editor.
2. In Authentication, add one user and disable public sign-ups.
3. Put your project URL and publishable key in `config.js`.
4. Deploy the folder to Vercel (or any static host) and point your domain at it.

## Design notes

Cream paper, hot-pink hero, tilted pastel cards, die-cut text stickers and a floating dragon fruit tip jar. Type is Fraunces (display) and Nunito (body). Intentionally a little handmade.

---

Made in Bengaluru by [Gracey Dugar](https://x.com/CreativeGracey). Fuelled by dragon fruit.
