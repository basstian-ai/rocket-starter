import { Bootstrapper } from '@crystallize/import-utilities';
import spec from './crystallize_import_spec_tools_products.json' assert { type: 'json' };
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.TENANT_ID || !process.env.ACCESS_TOKEN_ID || !process.env.ACCESS_TOKEN_SECRET) {
  console.error('Error: Missing Crystallize credentials in .env file. Please ensure TENANT_ID, ACCESS_TOKEN_ID, and ACCESS_TOKEN_SECRET are set.');
  process.exit(1);
}

const tenantIdentifier = process.env.TENANT_ID;
const accessTokenId = process.env.ACCESS_TOKEN_ID;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const run = async () => {
  const bootstrapper = new Bootstrapper();
  bootstrapper.setAccessToken(accessTokenId, accessTokenSecret);
  bootstrapper.setTenantIdentifier(tenantIdentifier);
  bootstrapper.setSpec(spec);

  console.log(`Starting import to tenant: ${tenantIdentifier}...`);
  await bootstrapper.start();
  console.log('Import completed successfully.');
};

run().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
