import {useState} from 'react';
import {Await, Link} from '@remix-run/react';
import {Suspense, useId} from 'react';
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
}) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      <SubMenuAside header={header} publicStoreDomain={publicStoreDomain} />
      <SubscribeAside />
      <LocationAside />
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
            onChange={(e) => setGender(e.target.value)}
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
            onChange={(e) => setGender(e.target.value)}
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

function LocationAside() {
  return (
    <Aside type="location" heading="choose country">
      <LocationForm />
    </Aside>
  );
}

function LocationForm() {
  return <div>location</div>;
}

/**
 * @param {{cart: PageLayoutProps['cart']}}
 */
function CartAside({cart}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return <Aside type="search" heading="SEARCH"></Aside>;
}

/**
 * @param {{
 *   header: PageLayoutProps['header'];
 *   publicStoreDomain: PageLayoutProps['publicStoreDomain'];
 * }}
 */
function MobileMenuAside({header, publicStoreDomain}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
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
