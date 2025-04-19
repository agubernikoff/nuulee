import {useState} from 'react';
import {Await, Link, useLocation, Form} from '@remix-run/react';
import {Suspense, useId, useEffect} from 'react';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {useAside} from './Aside';
import {AnimatePresence, motion} from 'motion/react';

/**
 * @param {PageLayoutProps}
 */
export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
  availableCountries,
  selectedLocale,
}) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside
        header={header}
        publicStoreDomain={publicStoreDomain}
        availableCountries={availableCountries}
      />
      <SubMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      <SubscribeAside />
      <LocationAside
        availableCountries={availableCountries}
        selectedLocale={selectedLocale}
      />
      <SizeGuideAside />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
        />
      )}
      <main>{children}</main>
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside.Provider>
  );
}

function SubMenuAside({header, publicStoreDomain}) {
  const {subType} = useAside();
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="submenu" closeOnMouseLeave={true}>
        <HeaderMenu
          menu={{
            id: header.menu.id,
            items:
              header?.menu?.items.find((item) => item.title === subType)
                ?.items || [],
          }}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}

function SubscribeAside() {
  return (
    <Aside
      type="subscribe"
      heading="subscribe to newsletter"
      closeOnMouseLeave={true}
    >
      <SubscribeForm />
    </Aside>
  );
}
function SubscribeForm() {
  const [email, setEmail] = useState();
  const [gender, setGender] = useState();
  return (
    <div>
      <p>
        subscribe to receive all the information by email on our latest
        collections, products, and projects.
      </p>
      <div className="checkbox-container">
        <div>
          <input
            type="checkbox"
            id="womens"
            name="gender"
            value="womens"
            checked={gender === 'womens'}
            onChange={(e) => {
              if (gender !== 'womens') setGender(e.target.value);
              else setGender(null);
            }}
          />
          <label htmlFor="womens">womens</label>
        </div>
        <div>
          <input
            type="checkbox"
            id="mens"
            name="gender"
            value="mens"
            checked={gender === 'mens'}
            onChange={(e) => {
              if (gender !== 'mens') setGender(e.target.value);
              else setGender(null);
            }}
          />
          <label htmlFor="mens">mens</label>
        </div>
      </div>
      <div className="email-input-container">
        <input
          placeholder="enter email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        ></input>
        <button className="reset">submit</button>
      </div>
      <p className="subscribe-subtext">
        by subscribing to our newsletter, you agree to receive promotional
        content from nüülee in accordance with our <a>privacy policy.</a>
      </p>
    </div>
  );
}

function LocationAside({availableCountries, selectedLocale}) {
  const {close} = useAside();
  return (
    <Aside type="location" heading="choose country">
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={availableCountries}>
          {(availableCountries) => {
            return (
              <LocationForm
                availableCountries={availableCountries}
                selectedLocale={selectedLocale}
                close={close}
              />
            );
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function LocationForm({availableCountries, selectedLocale, close}) {
  const {pathname} = useLocation();
  const {type} = useAside();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState({
    currency: {
      isoCode: 'USD',
      name: 'United States Dollar',
      symbol: '$',
    },
    isoCode: 'US',
    name: 'United States',
    unitSystem: 'IMPERIAL_SYSTEM',
  });

  useEffect(
    () => setCountry(availableCountries.localization.country),
    [availableCountries, pathname, selectedLocale],
  );

  useEffect(() => {
    setTimeout(() => setCountry(availableCountries.localization.country), 300);
  }, [type]);

  const options = availableCountries.localization.availableCountries.map(
    (c) => (
      <p
        className="country-option"
        key={c.isoCode}
        onClick={() => {
          setCountry(c);
          setOpen(false);
        }}
      >{`${c.name.toLowerCase()} / ${c.currency.isoCode.toLowerCase()}`}</p>
    ),
  );

  const strippedPathname = pathname.includes('EN-')
    ? pathname
        .split('/')
        .filter((part) => !part.includes('EN-'))
        .join('/')
    : pathname;
  return (
    <div className="location-form">
      <p>
        {'Please select the country where your order will be shipped to. This will give you the correct pricing, delivery dates and shipping costs for your destination. All orders are dispatched from the united states.'.toLowerCase()}
      </p>
      <div className="country-dropdown">
        <div className="location-select" onClick={() => setOpen(true)}>
          <p>{`${country.name.toLowerCase()} / ${country.currency.isoCode.toLowerCase()}`}</p>
          <svg
            width="7"
            height="8"
            viewBox="0 0 7 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 3.79668L0.7 7.43399L0.7 0.159373L7 3.79668Z"
              fill="black"
            />
          </svg>
        </div>
        {open ? (
          <div className="country-dropdown-content">{options}</div>
        ) : null}
      </div>
      {open ? (
        <button
          className="close-dropdown"
          onClick={() => setOpen(false)}
        ></button>
      ) : null}
      <Form method="post" action="/locale" preventScrollReset={true}>
        <input type="hidden" name="language" value={country.language} />
        <input type="hidden" name="country" value={country.isoCode} />
        <input type="hidden" name="path" value={strippedPathname} />
        <button type="submit" onClick={close} className="add-to-cart-form-pdp">
          save
        </button>
      </Form>
    </div>
  );
}

/**
 * @param {{cart: PageLayoutProps['cart']}}
 */
function CartAside({cart}) {
  return (
    <Suspense fallback={<p>Loading cart ...</p>}>
      <Await resolve={cart}>
        {(cartData) => (
          <Aside
            type="cart"
            heading={`shopping bag (${cartData?.totalQuantity || 0})`}
          >
            <CartMain cart={cartData} layout="aside" />
          </Aside>
        )}
      </Await>
    </Suspense>
  );
}

function SearchAside() {
  return <Aside type="search" heading="SEARCH"></Aside>;
}

/**
 * @param {{
 *   header: PageLayoutProps['header'];
 *   publicStoreDomain: PageLayoutProps['publicStoreDomain'];
 * }}
 */
function MobileMenuAside({header, publicStoreDomain, availableCountries}) {
  const {subType, open} = useAside();
  const queriesDatalistId = useId();

  const [country, setCountry] = useState({
    currency: {
      isoCode: 'USD',
      name: 'United States Dollar',
      symbol: '$',
    },
    isoCode: 'US',
    name: 'United States',
    unitSystem: 'IMPERIAL_SYSTEM',
  });

  useEffect(() => {
    availableCountries.then((countries) =>
      setCountry(countries.localization.country),
    );
  }, [availableCountries]);
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={subType || 'default'}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
          >
            <HeaderMenu
              menu={{
                id: header.menu.id,
                items: subType
                  ? header?.menu?.items.find((item) => item.title === subType)
                      ?.items
                  : header.menu.items,
              }}
              viewport="mobile"
              primaryDomainUrl={header.shop.primaryDomain.url}
              publicStoreDomain={publicStoreDomain}
              displayBackButton={subType}
            />
            {!subType ? <div className="divider" /> : null}
            {!subType ? (
              <button
                className="mobile-menu-btn"
                onClick={() => open('mobile', 'subscribe to our newsletter')}
              >
                <svg
                  width="18"
                  height="12"
                  viewBox="0 0 18 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.18605 0.587402C1.08358 0.587402 1 0.670251 1 0.773449V10.82C1 10.9224 1.08358 11.006 1.18605 11.006H16.814C16.9164 11.006 17 10.9224 17 10.82V0.773449C17 0.670251 16.9164 0.587402 16.814 0.587402H1.18605ZM1.73256 0.959495H16.2674L9.00009 6.66889L1.73256 0.959495ZM1.37209 1.15717L8.88372 7.05838C8.95204 7.11289 9.04797 7.11289 9.11628 7.05838L16.6279 1.15717V10.634H1.37209V1.15717Z"
                    fill="black"
                    stroke="black"
                    strokeWidth="0.3"
                  />
                </svg>
                subscribe
              </button>
            ) : subType === 'subscribe to our newsletter' ? (
              <div className="mobile-menu-alt-view-container">
                <SubscribeForm />
              </div>
            ) : null}
            {!subType ? (
              <button
                className="mobile-menu-btn"
                onClick={() => open('mobile', 'choose country')}
              >
                <svg
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.94691 0.174805C4.62257 0.174805 1.11914 3.68428 1.11914 7.99973C1.11914 12.3221 4.6231 15.8246 8.94691 15.8246C13.2636 15.8246 16.769 12.3221 16.769 7.99973C16.769 3.68428 13.2643 0.174805 8.94691 0.174805ZM9.74926 0.81531C12.2744 1.09526 14.4065 2.6764 15.4616 4.87093H11.6221C11.2866 3.24746 10.678 1.79698 9.74926 0.81531ZM8.12509 0.821562C7.1977 1.80315 6.58707 3.24871 6.25227 4.87096H2.42517C3.47762 2.67998 5.60191 1.10575 8.12509 0.821562ZM8.93371 0.877832C9.9146 1.68853 10.6162 3.15631 10.9997 4.87085H6.87398C7.25605 3.15846 7.9549 1.68913 8.93371 0.877832ZM2.1696 5.47462H6.13346C6.00077 6.2992 5.94034 7.15575 5.94034 8.01238C5.94104 8.86128 6.00286 9.71505 6.13346 10.5313H2.1696C1.87576 9.74352 1.71528 8.89114 1.71528 7.99993C1.71528 7.11004 1.87575 6.26166 2.1696 5.47462ZM6.75589 5.47462H11.1178C11.2609 6.29296 11.3421 7.1502 11.3414 8.01238C11.3414 8.86823 11.265 9.72062 11.124 10.5313H6.74951C6.60779 9.7199 6.53832 8.86752 6.53763 8.01238C6.53694 7.15027 6.61278 6.29303 6.75589 5.47462ZM11.7402 5.47462H15.7165C16.0103 6.2617 16.1708 7.1099 16.1708 7.99975C16.1708 8.89172 16.0103 9.74341 15.7165 10.5311H11.7402C11.8708 9.71416 11.9389 8.8611 11.9396 8.0122C11.9396 7.15566 11.8729 6.29929 11.7402 5.47462ZM2.41893 11.1287H6.24603C6.57948 12.7507 7.18941 14.1999 8.11263 15.1781C5.59016 14.8918 3.46872 13.3218 2.41893 11.1287ZM6.87469 11.1287H11.0004C10.6176 12.8501 9.91666 14.3235 8.93442 15.1279C7.95561 14.3228 7.25745 12.848 6.87469 11.1287ZM11.629 11.1287H15.4624C14.4078 13.3225 12.2787 14.9029 9.75622 15.1843C10.685 14.2062 11.2949 12.755 11.629 11.1287Z"
                    fill="black"
                    stroke="black"
                    strokeWidth="0.3"
                  />
                </svg>{' '}
                {`${country.name.toLowerCase()} / ${country.currency.isoCode.toLowerCase()}`}
              </button>
            ) : subType === 'choose country' ? (
              <div className="mobile-menu-alt-view-container">
                <Suspense fallback={<div>Loading...</div>}>
                  <Await resolve={availableCountries}>
                    {(availableCountries) => {
                      return (
                        <LocationForm availableCountries={availableCountries} />
                      );
                    }}
                  </Await>
                </Suspense>
              </div>
            ) : null}
            {!subType ? <div className="divider" /> : null}
            {!subType ? (
              <SearchFormPredictive>
                {({fetchResults, goToSearch, inputRef}) => (
                  <>
                    <div>
                      <label htmlFor="q">
                        <svg
                          width="19"
                          height="16"
                          viewBox="0 0 19 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            cx="6.91526"
                            cy="7.12229"
                            r="5.64573"
                            stroke="black"
                          />
                          <line
                            x1="11.5953"
                            y1="10.2269"
                            x2="17.741"
                            y2="14.6167"
                            stroke="black"
                          />
                        </svg>
                      </label>
                      <input
                        name="q"
                        id="q"
                        onChange={fetchResults}
                        onFocus={fetchResults}
                        placeholder="search"
                        ref={inputRef}
                        type="search"
                        list={queriesDatalistId}
                      />
                    </div>
                    <button onClick={goToSearch} className="mobile-menu-btn">
                      <svg
                        width="7"
                        height="8"
                        viewBox="0 0 7 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 3.79668L0.7 7.43399L0.7 0.159373L7 3.79668Z"
                          fill="black"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </SearchFormPredictive>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </Aside>
    )
  );
}

function SizeGuideAside() {
  return <Aside type="size-guide"></Aside>;
}

/**
 * @typedef {Object} PageLayoutProps
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 * @property {React.ReactNode} [children]
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
