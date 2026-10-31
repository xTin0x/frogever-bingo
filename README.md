This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Weekly board administration

Set `BINGO_ADMIN_USER_IDS` to a comma-separated list of Discord user IDs allowed to publish weekly board tasks. The existing singular `BINGO_ADMIN_USER_ID` variable is still accepted for compatibility. After authenticating as one of those users, open `/admin` or send a `POST` request to `/api/admin/boards` with a current or future week ID and nine tasks for each board:

```json
{
	"weekId": "2026-10-28",
	"tasks": {
		"board1": ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5", "Task 6", "Task 7", "Task 8", "Task 9"],
		"board2": ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5", "Task 6", "Task 7", "Task 8", "Task 9"]
	}
}
```

Future board definitions are stored in the database but are not returned by the public board API until their week begins.

The dev branch currently starts weekly periods at October 21, 2026 at 23:00 GMT and seeds the default boards for October 21 and October 28. The first week is available as a read-only preview before its start time.
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
