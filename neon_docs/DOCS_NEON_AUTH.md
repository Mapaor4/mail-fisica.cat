# Neon Auth

Managed authentication that branches with your database

Copy page

#### Beta

The **Neon Auth with Better Auth** is in Beta. Share your feedback on [Discord](https://discord.gg/92vNTzKDGp) or via the [Neon Console](https://console.neon.tech/app/projects?modal=feedback).

Neon Auth is a managed authentication service that stores users, sessions, and auth configuration directly in your Neon database. When you branch your database, your entire auth state branches with it. This lets you test real authentication workflows in preview environments.

## Quick start guides[](https://neon.com/docs/auth/overview#quick-start-guides)

Choose your framework to get started:

*   [

    ![next-js logo](https://neon.com/images/technology-logos/next-js.svg)![next-js logo](https://neon.com/images/technology-logos/next-js-dark.svg)

    ### Next.js

    Quick start with API methods

    ](https://neon.com/docs/auth/quick-start/nextjs-api-only)
*   [

    ![react logo](https://neon.com/images/technology-logos/react.svg)

    ### React

    Quick start with API methods

    ](https://neon.com/docs/auth/quick-start/react)
*   [

    ![tanstack logo](https://neon.com/images/technology-logos/tanstack.svg)![tanstack logo](https://neon.com/images/technology-logos/tanstack-dark.svg)

    ### TanStack Router

    With UI components

    ](https://neon.com/docs/auth/quick-start/tanstack-router)

#### Using an AI coding tool?

Run [`neonctl init`](https://neon.com/docs/reference/cli-init) to configure your editor with the Neon MCP server and agent skills, including Neon Auth setup guidance:

```
npx neonctl@latest init
```

## Why Neon Auth?[](https://neon.com/docs/auth/overview#why-neon-auth)

*   **Identity lives in your database**  
    All authentication data is stored in the `neon_auth` schema. It's queryable with SQL and compatible with Row Level Security (RLS) policies.

*   **Zero server management**  
    Neon Auth runs as a managed REST API service. Configure settings in the Console; use the [client SDK](https://neon.com/docs/reference/javascript-sdk) or [server SDK](https://neon.com/docs/auth/reference/nextjs-server) in your app. No infrastructure to maintain.

*   **Auth that branches with your data**  
    Test sign-up, login, password reset, and OAuth flows in isolated branches without touching production data.

## Built on Better Auth[](https://neon.com/docs/auth/overview#built-on-better-auth)

Neon Auth is powered by [Better Auth](https://www.better-auth.com/), which means you get familiar APIs. You can use Better Auth UI components or call auth methods directly to build your own UI.

Neon Auth currently supports Better Auth version **1.4.18**.

### When to use Neon Auth vs. self-hosting Better Auth[](https://neon.com/docs/auth/overview#when-to-use-neon-auth-vs-self-hosting-better-auth)

Neon Auth is a managed authentication service built into Neon's architecture:

*   **Branch-aware authentication**: Every Neon branch gets its own isolated auth environment, so you can test authentication features without affecting your production branch.
*   **Built-in Data API integration**: JWT token validation for the Data API has native support for Neon Auth.
*   **No infrastructure to manage**: Neon Auth is deployed in the same region as your database, reducing latency without requiring you to run auth infrastructure.
*   **Shared OAuth credentials for testing**: Get started quickly with out-of-the-box Google OAuth credentials, eliminating the setup complexity for testing and prototyping.

Self-hosting Better Auth makes sense if you need:

*   Flexibility in auth configuration: custom plugins, hooks, and options not yet supported by Neon Auth.
*   Full control over your auth code and the ability to run it inside your own infrastructure.

For more details on the SDK differences between `@neondatabase/auth` and `better-auth/client`, see [Why use @neondatabase/auth over better-auth/client](https://github.com/neondatabase/neon-js/blob/main/packages/auth/neon-auth_vs_better-auth.md).

As Neon Auth evolves, more Better Auth integrations and features will be added. Check the [roadmap](https://neon.com/docs/auth/roadmap) to see what's currently supported and what's coming next.

## Basic usage[](https://neon.com/docs/auth/overview#basic-usage)

Enable Auth in your Neon project, then add authentication to your app.

**For Next.js (server-side):**

See the [Next.js Server SDK reference](https://neon.com/docs/auth/reference/nextjs-server) for complete API documentation.

lib/auth/server.ts

```
import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
```

app/api/auth/\[...path\]/route.ts

```
import { auth } from '@/lib/auth/server';

export const { GET, POST } = auth.handler();
```

**For React/Vite (client-side):**

See the [Client SDK reference](https://neon.com/docs/reference/javascript-sdk) for complete API documentation.

src/auth.ts

```
import { createAuthClient } from '@neondatabase/neon-js/auth';

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);
```

src/App.tsx

```
import { NeonAuthUIProvider, AuthView } from '@neondatabase/auth-ui';
import { authClient } from './auth';

export default function App() {
  return (
    <NeonAuthUIProvider authClient={authClient}>
      <AuthView pathname="sign-in" />
    </NeonAuthUIProvider>
  );
}
```

## Use cases[](https://neon.com/docs/auth/overview#use-cases)

*   **Production authentication**  
    Use Neon Auth as the identity system for your app. Store users, sessions, and OAuth configuration directly in Postgres, and pair with RLS for secure, database-centric access control.

*   **Preview environments**  
    Test full authentication flows in Vercel previews with real users and sessions

*   **Multi-tenant SaaS**  
    Test complex org and role hierarchies safely in isolated branches

*   **CI/CD workflows**  
    Run end-to-end auth tests without touching production. The [Neon Create Branch GitHub Action](https://github.com/marketplace/actions/neon-create-branch-github-action) supports retrieving branch-specific auth URLs for testing authentication flows in GitHub Actions workflows.

*   **Development workflows**  
    Spin up complete environments instantly with database and auth together

See [Branching authentication](https://neon.com/docs/auth/branching-authentication) for details on how auth branches with your database.

## Example applications[](https://neon.com/docs/auth/overview#example-applications)

Beyond the quick starts on this site, the [neondatabase/neon-js](https://github.com/neondatabase/neon-js) monorepo ships **more runnable Neon Auth and `neon-js` samples** under [`examples/`](https://github.com/neondatabase/neon-js/tree/main/examples). It includes Next.js and React apps, cross-subdomain setups, the Organization plugin, alternative UI stacks, and Data API patterns. Each folder includes its own README (many workflows use **bun** from the repository root). Browse there when you want a full project to clone next to the guides here.

## Availability[](https://neon.com/docs/auth/overview#availability)

Neon Auth is currently available for AWS regions only. Azure support is not yet available.

Neon Auth does not currently support projects with [IP Allow](https://neon.com/docs/manage/projects#configure-ip-allow) or [Private Networking](https://neon.com/docs/guides/neon-private-networking) enabled.

## Pricing[](https://neon.com/docs/auth/overview#pricing)

Neon Auth is included in all Neon plans based on Monthly Active Users (MAU):

*   **Free**: Up to 60,000 MAU
*   **Launch**: Up to 1M MAU
*   **Scale**: Up to 1M MAU

An MAU (Monthly Active User) is a unique user who authenticates at least once during a monthly billing period. If you need more than 1M MAU, request an increase in the [console feedback form](https://console.neon.tech/app/settings?modal=feedback&modalparams=%22Neon%20auth%20limit%20increase%22).

See [Neon plans](https://neon.com/docs/introduction/plans#auth) for more details.

## Migration from Stack Auth[](https://neon.com/docs/auth/overview#migration-from-stack-auth)

If you're using the previous Neon Auth implementation via Stack Auth, your version will continue to work. When you're ready to migrate to the new Better Auth implementation, see our [migration guide](https://neon.com/docs/auth/migrate/from-legacy-auth).