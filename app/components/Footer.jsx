import {Suspense} from 'react';
import {Await, NavLink} from '@remix-run/react';

/**
 * @param {FooterProps}
 */
export function Footer({footer: footerPromise, header, publicStoreDomain}) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>{(footer) => <FooterMenu />}</Await>
    </Suspense>
  );
}

/**
 * @param {{
 *   menu: FooterQuery['menu'];
 *   primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
 *   publicStoreDomain: string;
 * }}
 */
function FooterMenu() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <div className="footer-column">
          <p className="footer-heading">brand</p>
          <a href="#">instagram</a>
          <a href="#">showroom</a>
          <a href="#">subscribe</a>
          <a href="#">sustainability</a>
        </div>

        <div className="footer-column">
          <p className="footer-heading">support</p>
          <a href="#">faq</a>
          <a href="#">contact us</a>
          <a href="#">returns & exchanges</a>
          <a href="#">care guide</a>
        </div>

        <div className="footer-column">
          <p className="footer-heading">legal</p>
          <a href="#">terms & conditions</a>
          <a href="#">privacy policy</a>
          <a href="#">cookies</a>
          <a href="#">accessibility</a>
        </div>
      </div>

      <div className="footer-info">
        <p className="footer-heading">
          © nüülee new york 2025, all rights reserved / site credit
        </p>
        <p>
          sustainability is at the heart of what we do. we prioritize{' '}
          <a href="#" className="footer-link-underline">
            ethical practices
          </a>
          , from responsibly sourcing our cashmere from nomadic herders to
          crafting timeless pieces designed to last.
        </p>
      </div>
    </footer>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({isActive, isPending}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'white',
  };
}

/**
 * @typedef {Object} FooterProps
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
