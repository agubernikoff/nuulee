import {useLoaderData, useLocation} from '@remix-run/react';
import {useState} from 'react';
import {motion, AnimatePresence} from 'motion/react';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
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
async function loadCriticalData({context, params}) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Page() {
  /** @type {LoaderReturnData} */
  const {page} = useLoaderData();
  const {pathname} = useLocation();

  return (
    <div className="page">
      <header>
        <p className="page-title">{page.title}</p>
      </header>
      {pathname === '/pages/faq' ? (
        <FAQs faqs={page.metafield.value} />
      ) : (
        <main dangerouslySetInnerHTML={{__html: page.body}} />
      )}
    </div>
  );
}

function FAQs({faqs}) {
  const parsed = JSON.parse(faqs);
  const mapped = parsed.sections.map((section) => (
    <FaqSection section={section} key={section.title} />
  ));
  return <main>{mapped}</main>;
}

function FaqSection({section}) {
  const mapped = section.questions.map((q) => (
    <motion.div layout>
      <Expandable title={q.question} details={q.answer} />
      <motion.div className="divider" layout />
    </motion.div>
  ));
  return (
    <motion.div className="faq-section" layout>
      <motion.p layout>
        <motion.strong>{section.title}</motion.strong>
      </motion.p>
      <motion.div className="divider" layout />
      {mapped}
    </motion.div>
  );
}

function Expandable({title, details}) {
  const [open, setOpen] = useState(false);

  function toggleOpen() {
    setOpen(!open);
  }
  return (
    <motion.div
      className="dropdown"
      layout="position"
      initial={{height: '1rem'}}
      animate={{height: open ? 'auto' : '1rem'}}
      style={{overflow: 'hidden'}}
    >
      <motion.p
        layout="position"
        className={`dropdown-header ${open ? 'open' : ''}`}
        onClick={() => toggleOpen()}
      >
        <span className="dropdown-title">{title}</span>
        <span className={`icon ${open ? 'open' : ''}`}>
          <Triangle />
        </span>
      </motion.p>
      <motion.div style={{overflow: 'hidden'}} layout>
        <motion.div
          className="dropdown-content"
          initial={{opacity: 0}}
          animate={{opacity: open ? 1 : 0}}
          transition={{ease: 'easeOut'}}
          layout
        >
          {details}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Triangle() {
  return (
    <svg
      width="6"
      height="8"
      viewBox="0 0 6 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4L1.50571e-07 7.4641L4.53412e-07 0.535898L6 4Z"
        fill="black"
      />
    </svg>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      metafield(namespace:"custom",key:"test"){
        value
      }
      seo {
        description
        title
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
