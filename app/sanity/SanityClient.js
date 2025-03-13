import {createClient} from '@sanity/client';

export const sanityClient = createClient({
  projectId: 'hj7h0g6k',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
});
