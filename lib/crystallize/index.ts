import { createClient, ClientInterface } from '@crystallize/js-api-client'; // Changed Client to ClientInterface

const CRYSTALLIZE_TENANT_IDENTIFIER = process.env.CRYSTALLIZE_TENANT_IDENTIFIER; // Changed variable name
const CRYSTALLIZE_ACCESS_TOKEN_ID = process.env.CRYSTALLIZE_ACCESS_TOKEN_ID;
const CRYSTALLIZE_ACCESS_TOKEN_SECRET = process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET;

if (!CRYSTALLIZE_TENANT_IDENTIFIER) { // Changed variable name and error message
  throw new Error('CRYSTALLIZE_TENANT_IDENTIFIER environment variable is not set.');
}

if (!CRYSTALLIZE_ACCESS_TOKEN_ID) {
  throw new Error('CRYSTALLIZE_ACCESS_TOKEN_ID environment variable is not set.');
}

if (!CRYSTALLIZE_ACCESS_TOKEN_SECRET) {
  throw new Error('CRYSTALLIZE_ACCESS_TOKEN_SECRET environment variable is not set.');
}

const client: ClientInterface = createClient({ // Changed Client to ClientInterface
  tenantIdentifier: CRYSTALLIZE_TENANT_IDENTIFIER, // Changed variable name
  accessTokenId: CRYSTALLIZE_ACCESS_TOKEN_ID,
  accessTokenSecret: CRYSTALLIZE_ACCESS_TOKEN_SECRET,
});

export default client;
