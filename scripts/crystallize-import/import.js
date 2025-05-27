import { Bootstrapper } from '@crystallize/import-utilities';
import spec from './crystallize_import_spec_tools_products.json' assert { type: 'json' };
import dotenv from 'dotenv';

dotenv.config();

const tenantIdentifier = process.env.TENANT_ID;
const accessTokenId = process.env.ACCESS_TOKEN_ID;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const run = async () => {
  const bootstrapper = new Bootstrapper();
  bootstrapper.setAccessToken(accessTokenId, accessTokenSecret);
  bootstrapper.setTenantIdentifier(tenantIdentifier);
  bootstrapper.setSpec(spec);

  await bootstrapper.start();
};

run().catch(console.error);
