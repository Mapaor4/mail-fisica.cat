import { createClient } from "@neondatabase/neon-js";
import { NeonPostgrestClient, fetchWithToken } from "@neondatabase/postgrest-js";

const authUrl = process.env.NEON_AUTH_BASE_URL!;
const dataApiUrl = process.env.NEON_DATA_API_URL!;

export const dbClient = createClient({
  auth: { url: authUrl },
  dataApi: { url: dataApiUrl },
});

export const createAuthedClient = (jwtToken: string) => {
  const authFetch = fetchWithToken(async () => jwtToken);

  return new NeonPostgrestClient({
    dataApiUrl,
    options: {
      global: {
        fetch: authFetch,
      },
    },
  });
};
