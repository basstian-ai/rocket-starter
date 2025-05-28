import { Bootstrapper, EVENT_NAMES } from '@crystallize/import-utilities';
import spec from './crystallize_import_spec_tools_products.json' with { type: 'json' };
import dotenv from 'dotenv';

if (process.env.CI !== 'true') {
  dotenv.config();
}

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

  bootstrapper.on(EVENT_NAMES.ERROR, (error) => {
    console.error('Import process error:', JSON.stringify(error, null, 2));
    process.exit(1);
  });

  bootstrapper.on(EVENT_NAMES.DONE, (status) => {
    console.log(`Import truly completed for tenant "${bootstrapper.tenantIdentifier}" in ${status.duration}ms.`);
    console.log('Status:', JSON.stringify(status, null, 2));
    process.exit(0);
  });

  bootstrapper.on(EVENT_NAMES.STATUS_UPDATE, (status) => {
    console.log('Import status update:', JSON.stringify(status, null, 2));
  });

  console.log(`Starting import to tenant: ${tenantIdentifier}...`);
  bootstrapper.start();
  // No longer awaiting here, and removed the old success log.
  // The process will now wait for DONE or ERROR events.
};

run().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
