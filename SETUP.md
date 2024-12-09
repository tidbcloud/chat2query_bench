## Architecture

The project is built using Next.js, a React framework for server-side rendering and static site generation. It uses TypeScript for type safety and incorporates various libraries for state management, UI components, and data fetching.

Key components of the architecture include:

1. Next.js for the frontend and API routes
2. TiDB Cloud for database management
3. Redux for state management
4. tRPC for type-safe API calls
5. Mantine UI for styling

## Folder Structure

- `/components`: React components used throughout the application
- `/pages`: Next.js pages and API routes
- `/public`: Static assets
- `/server`: Server-side code, including tRPC router and database schema
- `/styles`: Global CSS styles
- `/utils`: Utility functions and helpers
- `/store`: Redux store configuration and slices

## Key Files

- `pages/_app.tsx`: Main application component
- `pages/api/gateway/[trpc].ts`: tRPC API handler
- `server/trpc.ts`: tRPC router configuration
- `server/schema.ts`: Database schema definitions
- `components/App.tsx`: Main application layout
- `utils/env.ts`: Environment variable management

## Deployment

The project is configured for deployment on Vercel, as evidenced by the Vercel-specific environment variables and configurations.

To deploy:

1. Set up a Vercel account and link it to your GitHub repository
2. Configure the required environment variables in Vercel's dashboard
3. Push your changes to the main branch, which will trigger an automatic deployment

## Required Environment

The project requires several environment variables to be set. These can be found in the `utils/env.ts` file:


```1:13:utils/env.ts
export const PrivateEnvVariables = {
  TiInsightDatabase: process.env.TIINSIGHT_DB_URI!,
  OpenApiDoc: `${process.env.DOC_HOST}/eda/apidocs/swagger.json`,
  ReuseDataSummary: process.env.REUSE_DATA_SUMMARY,
  NodeEnv: process.env.NODE_ENV,
  VercelEnv: process.env.VERCEL_ENV,
  MasterKeyV0: process.env.MASTER_KEY_V0!,
  TidbCloudDataAppEndpointHost: process.env.TIDBCLOUD_DATA_APP_ENDPOINT_HOST!,
  TidbCloudOauthClientId: process.env.TIDBCLOUD_OAUTH_CLIENT_ID!,
  TidbCloudOauthClientSecret: process.env.TIDBCLOUD_OAUTH_CLIENT_SECRET!,
  TidbCloudOauthHost: process.env.TIDBCLOUD_OAUTH_HOST!,
  TidbCloudOpenApiHost: process.env.TIDBCLOUD_OPEN_API_HOST!,
};

export const SampleDatasetConfig = {
  dataAppHost: `${process.env.SAMPLE_DB_DATA_APP_BASE_URL}/${process.env.SAMPLE_DB_DATA_APP_ID}/endpoint`,
  auth: `${process.env.SAMPLE_DB_PUBLIC_KEY}:${process.env.SAMPLE_DB_PRIVATE_KEY}`,
  dbUri: process.env.SAMPLE_DB_URI!,
};
```

Ensure these environment variables are properly set in your development environment and in your deployment platform.

A template for the environment variables can be found in `.env.example`.

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Set up the required environment variables in a `.env` file
4. Run the development server:
   ```
   pnpm dev
   ```

## Database

The project uses TiDB Cloud as its database. The schema is defined in `server/schema.ts`. To update the database schema:

1. Modify the schema in `server/schema.ts`
2. Run the database migration:
   ```
   pnpm db:generate
   pnpm db:push
   ```

## API Documentation

The project provides an OpenAPI documentation, which can be accessed at `/doc.html` when the application is running.

## Testing

The project uses Vitest for testing. Run tests with:

```
pnpm test
```

## Linting and Formatting

The project uses Biome for linting and formatting. The configuration can be found in `biome.json`.

## Error Tracking

Sentry is integrated for error tracking and monitoring. The configuration can be found in the following files:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

## Features

1. Natural language querying of databases
2. Data visualization
3. Database schema exploration
4. Task breakdown for complex queries
5. Canvas mode for visual representation of data relationships

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Run tests and ensure linting passes
5. Create a pull request
