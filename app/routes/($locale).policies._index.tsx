import {
    type MetaArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import {data, useLoaderData} from 'react-router';
import invariant from 'tiny-invariant';
import {getStyxSeoMeta} from '~/lib/seo-meta';

import {PageHeader, Section, Heading} from '~/components/Text';
import {Link} from '~/components/Link';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {validateLocale} from '~/lib/utils';
import type {NonNullableFields} from '~/lib/type';

export const headers = routeHeaders;

export async function loader({
  request,
  params,
  context: {storefront},
}: LoaderFunctionArgs) {
  validateLocale(params);
  const result = await storefront.query(POLICIES_QUERY);

  invariant(result, 'No data returned from Shopify API');
  const policies = Object.values(
    result.shop as NonNullableFields<typeof result.shop>,
  ).filter(Boolean);

  if (policies.length === 0) {
    throw new Response('Not found', {status: 404});
  }

  const seo = seoPayload.policies({policies, url: request.url});

  return data({
    policies,
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getStyxSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Policies() {
  const {policies} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader heading="Policies" />
      <Section padding="x" className="mb-24">
        {policies.map((policy) => {
          return (
            policy && (
              <Heading className="font-normal text-heading" key={policy.id}>
                <Link to={`/policies/${policy.handle}`}>{policy.title}</Link>
              </Heading>
            )
          );
        })}
      </Section>
    </>
  );
}

const POLICIES_QUERY = `#graphql
  fragment PolicyIndex on ShopPolicy {
    id
    title
    handle
  }

  query PoliciesIndex {
    shop {
      privacyPolicy {
        ...PolicyIndex
      }
      shippingPolicy {
        ...PolicyIndex
      }
      termsOfService {
        ...PolicyIndex
      }
      refundPolicy {
        ...PolicyIndex
      }
      subscriptionPolicy {
        id
        title
        handle
      }
    }
  }
`;
