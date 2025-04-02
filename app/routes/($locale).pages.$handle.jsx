import {useLoaderData} from '@remix-run/react';
import {useState, useEffect} from 'react';
import {motion} from 'motion/react';

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
  return (
    <div
      className="page"
      style={
        page.sections
          ? {width: '100%', marginTop: 'var(--header-height)'}
          : null
      }
    >
      <header>
        <p className="page-title">{page.title}</p>
      </header>
      {page.faq || page.sections ? (
        page.faq ? (
          <FAQs faqs={page.faq?.references?.nodes} />
        ) : (
          <Sections sections={page.sections?.references?.nodes} />
        )
      ) : (
        <main dangerouslySetInnerHTML={{__html: page.body}} />
      )}
    </div>
  );
}

function FAQs({faqs}) {
  const mapped = faqs.map((section) => (
    <FaqSection section={section} key={section.id} />
  ));
  return <main>{mapped}</main>;
}

function FaqSection({section}) {
  const title = section.fields.find(
    (field) => field.type === 'single_line_text_field',
  ).value;

  const questions =
    section.fields.find((field) => field.type === 'list.metaobject_reference')
      ?.references?.nodes || [];

  const mapped = questions.map((q) => (
    <motion.div layout key={q.id}>
      <Expandable
        title={q.fields.find((q) => q.key === 'question').value}
        details={q.fields.find((q) => q.key === 'answer').value}
      />
      <motion.div className="divider" layout />
    </motion.div>
  ));

  return (
    <motion.div className="faq-section" layout>
      <motion.p layout>
        <motion.strong>{title}</motion.strong>
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

  const answer = JSON.parse(details).children[0].children.map((child) => {
    if (child.type === 'text')
      return <span key={child.value}>{child.value}</span>;
    else if (child.type === 'link')
      return (
        <a
          href={child.url}
          key={child.children.find((c) => c.type === 'text').value}
        >
          {child.children.find((c) => c.type === 'text').value}
        </a>
      );
  });

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
          {answer}
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

function Sections({sections}) {
  const mapped = sections.map((section) => {
    console.log(section.type);
    switch (section.type) {
      case 'title_and_blurb':
        return <TitleAndBlurb section={section} key={section.id} />;
    }
  });
  return <main>{mapped}</main>;
}

function TitleAndBlurb({section}) {
  const [mapped, setMapped] = useState();
  useEffect(() => {
    const sectionTitle = section.fields.find(
      (f) => f.type === 'single_line_text_field',
    ).value;
    const pageTitle = document.querySelector('.page-title');
    pageTitle.innerText = sectionTitle;
    setMapped(
      mapRichText(
        JSON.parse(
          section.fields.find((f) => f.type === 'rich_text_field').value,
        ).children[0],
      ),
    );
  }, []);
  return <div className="title-and-blurb">{mapped}</div>;
}

function mapRichText(richTextObject) {
  console.log(richTextObject);
  switch (richTextObject.type) {
    case 'paragraph':
      return (
        <p style={{whiteSpace: 'pre-line'}}>
          {richTextObject.children.map((child) => mapRichText(child))}
        </p>
      );
    case 'text':
      if (richTextObject.bold)
        return (
          <strong key={richTextObject.value}>{richTextObject.value}</strong>
        );
      return richTextObject.value;
  }
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
      faq:metafield(key: "faqs", namespace: "custom") {
        references(first: 10) {
          nodes {
            ... on Metaobject {
              id
              fields {
                value
                references(first: 10) {
                  nodes {
                    ... on Metaobject {
                      id
                      fields {
                        value
                        key
                        type
                      }
                    }
                  }
                }
                type
              }
            }
          }
        }
      }
      sections:metafield(key: "sections", namespace: "custom") {
        references(first: 10) {
          nodes {
            ... on Metaobject {
              type
              id
              fields {
                type
                value
                references(first: 10) {
                  nodes {
                    ... on Metaobject {
                      id
                      fields {
                        value
                        key
                        type
                      }
                    }
                  }
                }
              }
            }
          }
        }
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
