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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Enterprise Features

### Security & Authorization
The system is designed with **Enterprise Security** in mind, integrating **Microsoft Entra External ID** as the primary identity provider.
- **Authentication**: OIDC/OAuth 2.0 via Azure Entra ID.
- **Authorization**: Role-Based Access Control (RBAC) with defined roles: `System Admin`, `Workspace Owner`, `AI Engineer`, `QA Lead`, `Stakeholder`.

See details in [Authorization Matrix](./docs/12-Authorization-Matrix.md).

## Documentation

- [Master Plan & Roadmap](./docs/00-Master-Plan.md)
- [Business Requirements](./docs/00-Business-Requirements.md)
- [System Architecture](./docs/01-System-Architecture.md)
- [Authorization Matrix](./docs/12-Authorization-Matrix.md)
- [API Specification](./docs/API-Specification.md)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
