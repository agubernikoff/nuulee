import {defer} from '@shopify/remix-oxygen';
import React, {Suspense, useRef, useEffect} from 'react';
import {useLoaderData, Await, useLocation} from '@remix-run/react';
import {PAGE_QUERY} from './($locale).pages.$handle';
import {HEADER_QUERY} from '~/lib/fragments';
import {Sections} from './($locale).pages.$handle';
import {Gallery} from './($locale).pages.$handle';

/**
 * Smooth scroll to section using refs
 */
function ScrollToHashEffect({refsMap, offset = 80}) {
  const {hash} = useLocation();

  useEffect(() => {
    if (!hash) return;
    const ref = refsMap[hash.replace('#', '')];
    if (!ref?.current) return;

    const y = ref.current.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({top: y, behavior: 'smooth'});
  }, [hash, refsMap, offset]);

  return null;
}

/**
 * Loader
 */
export async function loader({context}) {
  const {storefront} = context;

  // Fetch header menu
  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {headerMenuHandle: 'main-menu'},
    }),
  ]);

  const menuItems =
    header.menu?.items.find((i) => i.title === 'discover')?.items || [];

  const handles = menuItems
    .filter((i) => i.url?.includes('/pages/'))
    .map((i) => ({
      title: i.title,
      handle: i.url.split('/pages/')[1],
    }));

  if (!handles.length) {
    throw new Response('No menu pages found', {status: 404});
  }

  // Fetch all pages in parallel
  const pages = await Promise.all(
    handles.map(async ({title, handle}) => {
      const {page} = await storefront.query(PAGE_QUERY, {variables: {handle}});
      return {title, page};
    }),
  );

  return {pages, handles};
}

/**
 * Discover Page
 */
export default function Discover() {
  const {pages, handles} = useLoaderData();

  // Create refs for each handle
  const refsMap = handles.reduce((acc, {handle}) => {
    acc[handle] = useRef(null);
    return acc;
  }, {});

  return (
    <div className="discover-page page discover">
      <ScrollToHashEffect refsMap={refsMap} />

      {pages.map(({title, page}, index) => (
        <Section
          key={page.id}
          ref={refsMap[page.handle]}
          title={title}
          page={page}
          first={index === 0}
        />
      ))}
    </div>
  );
}
/**
 * Section component with forwarded ref
 */
const Section = React.forwardRef(({title, page, first}, ref) => (
  <section ref={ref} className={`discover-section ${first ? 'first' : ''}`}>
    {!page.sections?.references?.nodes
      .find((f) => f.type === 'title_and_blurb')
      .fields.find((f) => f.type === 'file_reference') && (
      <header>
        <p className="page-title">{title}</p>
      </header>
    )}
    <div className="section-body">
      {page.sections && (
        <Sections
          sections={
            page.handle === 'about'
              ? page.sections.references.nodes.filter(
                  (n) => n.type !== 'offset_images_and_blurb',
                )
              : page.sections?.references?.nodes
          }
          dontReplace
          isDev
        />
      )}
      {page.gallery_images && (
        <Gallery gallery_images={page.gallery_images?.references?.nodes} />
      )}
      {page.faq && <FAQs faqs={page.faq?.references?.nodes} />}
      {!page.sections && !page.gallery_images && !page.faq && (
        <main dangerouslySetInnerHTML={{__html: page.body}} />
      )}
    </div>
  </section>
));
