import { createClient, CrystallizeClient } from '@crystallize/js-api-client';

const CRYSTALLIZE_TENANT_ID = process.env.CRYSTALLIZE_TENANT_ID;
const CRYSTALLIZE_ACCESS_TOKEN_ID = process.env.CRYSTALLIZE_ACCESS_TOKEN_ID;
const CRYSTALLIZE_ACCESS_TOKEN_SECRET = process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET;

if (!CRYSTALLIZE_TENANT_ID) {
  throw new Error('CRYSTALLIZE_TENANT_ID environment variable is not set.');
}

if (!CRYSTALLIZE_ACCESS_TOKEN_ID) {
  throw new Error('CRYSTALLIZE_ACCESS_TOKEN_ID environment variable is not set.');
}

if (!CRYSTALLIZE_ACCESS_TOKEN_SECRET) {
  throw new Error('CRYSTALLIZE_ACCESS_TOKEN_SECRET environment variable is not set.');
}

const client: CrystallizeClient = createClient({
  tenantId: CRYSTALLIZE_TENANT_ID,
  accessTokenId: CRYSTALLIZE_ACCESS_TOKEN_ID,
  accessTokenSecret: CRYSTALLIZE_ACCESS_TOKEN_SECRET,
});

export default client;
