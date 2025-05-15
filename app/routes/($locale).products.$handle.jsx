import {useLoaderData, Await} from '@remix-run/react';
import {useState, useEffect, Suspense} from 'react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {motion, AnimatePresence} from 'motion/react';
import ProductGridItem from '~/components/ProductGridItem';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [
    {title: `nüülee | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context, params}) {
  const {handle} = params;
  const {storefront} = context;

  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.
  const recs = storefront.query(PRODUCT_RECOMENDATIONS_QUERY, {
    variables: {handle},
  });
  const compliments = storefront.query(COMPLEMENTARY_QUERY, {
    variables: {handle},
  });

  return {recs, compliments};
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, recs, compliments} = useLoaderData();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;

  const productImage = product.images.edges.map((edge) => (
    <ProductImage key={edge.node.id} image={edge.node} />
  ));

  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const [imageIndex, setImageIndex] = useState(0);

  function handleScroll(scrollWidth, scrollLeft) {
    const widthOfAnImage = scrollWidth / product?.images?.edges.length;
    const dividend = scrollLeft / widthOfAnImage;
    const rounded = parseFloat((scrollLeft / widthOfAnImage).toFixed(0));

    if (Math.abs(dividend - rounded) < 0.001) setImageIndex(rounded);
  }

  const mappedIndicators =
    product?.images?.edges.length > 1
      ? product?.images?.edges.map((e, i) => (
          <div
            key={e.node.id}
            className="circle"
            style={{
              background: 'var(--color-stroke-color)',
              opacity: i === imageIndex ? 1 : 0.33,
              height: '6px',
              width: '6px',
              borderRadius: '4px',
            }}
          ></div>
        ))
      : null;

  return (
    <div>
      <div className="product">
        <div style={{position: 'relative'}}>
          <div
            className="product-images"
            onScroll={(e) =>
              handleScroll(e.target.scrollWidth, e.target.scrollLeft)
            }
          >
            {productImage}
          </div>
          <div className="mapped-indicators">{mappedIndicators}</div>
        </div>
        <div className="product-main">
          <p>{title}</p>
          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
          <div className="divider" />
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
            hideSizeGuide={
              product.tags?.includes('accessories') ||
              product.tags?.includes('living')
            }
          />
          <div className="divider" />
          <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
          <div className="divider" />
          {/* this needs to be pulled properly */}
          <div className="dropdown-container">
            {[
              {
                title: 'details',
                details:
                  'this product is made from high-quality materials and designed for durability.',
              },
              {
                title: 'sustainability',
                details:
                  'we use eco-friendly materials and sustainable practices in our production.',
              },
            ].map((section) => (
              <Expandable
                key={section.title}
                openSection={openSection}
                toggleSection={toggleSection}
                title={section.title}
                details={section.details}
              />
            ))}
          </div>
          <motion.div className="divider" layout />
        </div>
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </div>
      <YouMayAlsoLike recs={recs} compliments={compliments} />
    </div>
  );
}

function Expandable({openSection, toggleSection, title, details}) {
  return (
    <motion.div
      key={title}
      className="dropdown"
      layout="position"
      initial={{height: '1rem'}}
      animate={{height: openSection === title ? 'auto' : '1rem'}}
      style={{overflow: 'hidden'}}
    >
      <motion.p
        layout="position"
        className={`dropdown-header ${openSection === title ? 'open' : ''}`}
        onClick={() => toggleSection(title)}
      >
        <span className="dropdown-title">{title}</span>
        <span className={`icon ${openSection === title ? 'open' : ''}`}>+</span>
      </motion.p>
      <div style={{overflow: 'hidden'}}>
        <motion.div
          className="dropdown-content"
          initial={{opacity: 0}}
          animate={{opacity: openSection === title ? 1 : 0}}
          key={title}
          transition={{ease: 'easeOut'}}
        >
          {details}
        </motion.div>
      </div>
    </motion.div>
  );
}

function YouMayAlsoLike({compliments, recs}) {
  const [resolvedCompliments, setResolvedCompliments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([compliments, recs])
      .then(([complimentsRes, recsRes]) => {
        const complimentsData = complimentsRes?.productRecommendations || [];
        const recsData = recsRes?.productRecommendations || [];

        const uniqueProducts = [
          ...new Map(
            [...complimentsData, ...recsData]
              .filter((p) => p?.id)
              .map((p) => [p.id, p]),
          ).values(),
        ].slice(0, 4);

        setResolvedCompliments(uniqueProducts);
      })
      .finally(() => setLoading(false));
  }, [compliments, recs]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="you-may-also-like-container">
      <p className="recs-title">you may also like</p>
      <div className="recommended-products">
        <div className="products-grid">
          {resolvedCompliments.map((product, index) => (
            <ProductGridItem
              key={product.id}
              product={product}
              loading={index < 8 ? 'eager' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    tags
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    
    selectedOrFirstAvailableVariant(
      selectedOptions: $selectedOptions
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_RECOMENDATIONS_QUERY = `#graphql
query MyQuery(
$country: CountryCode
$handle: String!
$language: LanguageCode
) @inContext(country: $country, language: $language) {
  productRecommendations(intent: RELATED, productHandle: $handle) {
    images(first: 2) {
      nodes {
        id
        url
        width
        height
        altText
      }
    }
    id
    handle
    title
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
}`;

const COMPLEMENTARY_QUERY = `#graphql
query MyQuery(
$country: CountryCode
$handle: String!
$language: LanguageCode
) @inContext(country: $country, language: $language) {
  productRecommendations(intent: COMPLEMENTARY, productHandle: $handle) {
    images(first: 2) {
      nodes {
        url
        width
        height
        altText
      }
    }
    id
    handle
    title
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
}`;
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
