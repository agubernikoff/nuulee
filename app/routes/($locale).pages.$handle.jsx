import {useLoaderData} from '@remix-run/react';
import React, {useState, useEffect, useRef} from 'react';
import {motion} from 'motion/react';
import {Image} from '@shopify/hydrogen';
import ComingSoon from '~/components/ComingSoon';

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

  const [{page}, comingsoon] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    context.storefront.query(COMING_SOON_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  if (page.coming_soon?.value === 'true' && !comingsoon) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    page,
    comingsoon,
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
  const {page, comingsoon} = useLoaderData();
  return (
    <div
      className={`page ${
        page.sections || page.gallery_images ? 'discover' : null
      } `}
    >
      {page.coming_soon?.value === 'true' ? (
        <ComingSoon comingsoon={comingsoon} />
      ) : (
        <>
          {page.hide_page_header?.value !== 'true' ? (
            <header>
              <p className="page-title">{page.title}</p>
            </header>
          ) : null}
          {page.faq || page.sections || page.gallery_images ? (
            <>
              {page.faq && <FAQs faqs={page.faq?.references?.nodes} />}

              {page.sections && (
                <Sections sections={page.sections?.references?.nodes} />
              )}
              {page.gallery_images && (
                <Gallery
                  gallery_images={page.gallery_images?.references?.nodes}
                />
              )}
            </>
          ) : (
            <main dangerouslySetInnerHTML={{__html: page.body}} />
          )}
        </>
      )}
    </div>
  );
}

function Gallery({gallery_images}) {
  const gallery = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(
    Math.floor(gallery_images.length / 2),
  );

  useEffect(() => {
    const element = gallery.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      centerCurrentIndex();
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  function centerCurrentIndex() {
    const initialValue = 0;
    const sumWithInitial = gallery_images
      .slice(0, currentIndex)
      .reduce((accumulator, img, i) => {
        const imageWidth =
          (img.image.width * gallery.current.offsetHeight) / img.image.height;

        const width =
          i === currentIndex - 1
            ? (window.innerWidth - imageWidth) / -2
            : imageWidth;
        return accumulator + width;
      }, initialValue);

    gallery.current.style.transform = `translateX(calc(${-sumWithInitial}px - ${
      currentIndex - 1
    }rem))`;
  }
  useEffect(() => {
    centerCurrentIndex();
  }, [currentIndex]);

  function handleClick(index) {
    setCurrentIndex(index + 1);
  }

  const images = gallery_images.map((img, i) => (
    <motion.div
      className="gallery-image"
      initial={{opacity: 0}}
      animate={{opacity: i === currentIndex - 1 ? 1 : 0.1}}
      key={img.id}
      transition={{duration: 0.75}}
    >
      <Image
        data={img.image}
        loading={'eager'}
        sizes="100vw"
        alt={img.altText}
        aspectRatio={`${img.image.width} / ${img.image.height}`}
      />
      <button onClick={() => handleClick(i)}></button>
    </motion.div>
  ));

  return (
    <div className="gallery-container">
      <motion.div className="gallery" ref={gallery}>
        {images}
      </motion.div>
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

  const answer = mapRichText(JSON.parse(details));

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
      case 'image_and_blurb':
        return <ImageAndBlurb section={section} key={section.id} />;
      case 'offset_images_and_blurb':
        return <OffsetImagesAndBlurb section={section} key={section.id} />;
    }
  });
  return <main>{mapped}</main>;
}

function TitleAndBlurb({section}) {
  useEffect(() => {
    const sectionTitle = section.fields.find(
      (f) => f.type === 'single_line_text_field',
    ).value;
    const pageTitle = document.querySelector('.page-title');
    pageTitle.innerText = sectionTitle;
  }, []);
  return (
    <div className="title-and-blurb">
      {mapRichText(
        JSON.parse(
          section.fields.find((f) => f.type === 'rich_text_field').value,
        ),
        'title-and-blurb',
      )}
    </div>
  );
}

function ImageAndBlurb({section}) {
  console.log(section);
  const photo = section.fields.find((f) => f.key === 'photo');
  const photoWidth = section.fields.find((f) => f.key === 'photo_width');
  const altMobilePhoto = section.fields.find(
    (f) => f.key === 'alternate_mobile_image',
  );
  const blurb = section.fields.find((f) => f.key === 'blurb');
  const blurbWidth = section.fields.find((f) => f.key === 'blurb_width');
  return (
    <div className="image-and-blurb">
      <div style={{width: `${photoWidth?.value}%` || '100%', margin: 'auto'}}>
        <Image
          alt={photo.reference.image.altText}
          aspectRatio={`${photo.reference.image.width}/${photo.reference.image.height}`}
          data={photo.reference.image}
          loading={'eager'}
          width={photo.reference.image.width}
          sizes="100vw"
        />
        {altMobilePhoto ? (
          <Image
            alt={altMobilePhoto.reference.image.altText}
            aspectRatio={`${altMobilePhoto.reference.image.width}/${altMobilePhoto.reference.image.height}`}
            data={altMobilePhoto.reference.image}
            loading={'eager'}
            sizes="100vw"
            className="alt-mobile-photo"
          />
        ) : null}
      </div>
      {blurb ? (
        <div style={{width: `${blurbWidth?.value}%` || '100%', margin: 'auto'}}>
          {mapRichText(JSON.parse(blurb.value), 'image-and-blurb')}
        </div>
      ) : null}
    </div>
  );
}

function OffsetImagesAndBlurb({section}) {
  const images = section.fields
    .find((f) => f.type === 'list.metaobject_reference')
    .references.nodes.map((node) => {
      const isPrimary =
        node.fields.find((f) => f.key === 'is_primary')?.value === 'true'
          ? true
          : false;

      const image = node.fields.find((f) => f.key === 'image')?.reference
        ?.image;

      return {isPrimary, image};
    })
    .sort((a, b) => (b.isPrimary ? 1 : -1));

  return (
    <div className="section-container">
      <div className="section-text-container">
        {mapRichText(
          JSON.parse(
            section.fields.find((f) => f.type === 'rich_text_field').value,
          ),
          'offset-images-and-blurb',
        )}
        <div>
          <Image
            alt={images[1].image.altText}
            aspectRatio={`${images[1].image.width}/${images[1].image.height}`}
            data={images[1].image}
            loading={'eager'}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        </div>
      </div>
      <div className="section-img-container">
        <Image
          alt={images[0].image.altText}
          aspectRatio={`${images[0].image.width}/${images[0].image.height}`}
          data={images[0].image}
          loading={'eager'}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      </div>
    </div>
  );
}

function mapRichText(richTextObject, index = 0) {
  // console.log(index, richTextObject);
  switch (richTextObject.type) {
    case 'root':
      return (
        <React.Fragment key={index}>
          {richTextObject.children.map((child, childIndex) =>
            mapRichText(child, `${index}-${childIndex}`),
          )}
        </React.Fragment>
      );
    case 'paragraph':
      return (
        <p key={index} style={{whiteSpace: 'pre-line'}}>
          {richTextObject.children.map((child, childIndex) =>
            mapRichText(child, `${index}-${childIndex}`),
          )}
        </p>
      );
    case 'text':
      if (richTextObject.bold)
        return <strong key={index}>{richTextObject.value}</strong>;
      return <span key={index}>{richTextObject.value}</span>;
    case 'list':
      if (richTextObject.listType === 'ordered')
        return (
          <ol
            key={`${richTextObject.type}-${richTextObject.listType}-${index}`}
          >
            {richTextObject.children.map((child, childIndex) =>
              mapRichText(child, `${index}-${childIndex}`),
            )}
          </ol>
        );
    case 'list-item':
      return (
        <li key={index} style={{whiteSpace: 'pre-line'}}>
          {richTextObject.children.map((child, childIndex) =>
            mapRichText(child, `${index}-${childIndex}`),
          )}
        </li>
      );
    case 'link':
      return (
        <a href={richTextObject.url} key={index}>
          {richTextObject.children.map((child, childIndex) =>
            mapRichText(child, `${index}-${childIndex}`),
          )}
        </a>
      );
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
      coming_soon:metafield(key: "coming_soon", namespace: "custom"){
        value
      }
      hide_page_header:metafield(key: "hide_page_header", namespace: "custom"){
        value
      }
      gallery_images: metafield(key: "gallery_images", namespace: "custom") {
        references(first: 25) {
          nodes {
            ... on MediaImage {
              id
              __typename
              image {
                url
                height
                id
                width
                altText
              }
            }
          }
        }
      }
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
                key
                reference{
                  ...on MediaImage{
                    id
                    __typename
                    image{
                      url
                      height
                      id
                      width
                      altText
                    }
                  }
                }
                references(first: 10) {
                  nodes {
                    ... on Metaobject {
                      id
                      fields {
                        value
                        key
                        reference {
                          ... on MediaImage {
                            id
                            __typename
                            image {
                              url
                              height
                              id
                              width
                              altText
                            }
                          }
                        }
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
const COMING_SOON_QUERY = `#graphql
  query ComingSoon {
    metaobject(
      handle: {handle: "coming-soon-image-hezp7ylm", type: "coming_soon_image"}
    ) {
      field(key: "comingsoon") {
        value
        reference {
          ... on MediaImage {
            id
            alt
            image {
              altText
              height
              id
              url
              width
            }
          }
        }
      }
    }
  }`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
