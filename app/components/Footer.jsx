import {Suspense} from 'react';
import {Await, NavLink} from '@remix-run/react';

/**
 * @param {FooterProps}
 */
export function Footer({footer: footerPromise, publicStoreDomain}) {
  return (
    <Suspense fallback={<div>Loading footer...</div>}>
      <Await resolve={footerPromise}>
        {(footer) => {
          return (
            <FooterMenu
              menu={footer.menu}
              publicStoreDomain={publicStoreDomain}
            />
          );
        }}
      </Await>
    </Suspense>
  );
}

/**
 * @param {{
 *   menu: FooterQuery['menu'];
 *   publicStoreDomain: string;
 * }}
 */
export function FooterMenu({menu, publicStoreDomain}) {
  return (
    <footer className="footer">
      <div className="footer-links">
        {menu &&
          menu.items.map((item) => {
            // If item is a category (brand, support, legal), render each category as a column
            if (item.items && item.items.length > 0) {
              return (
                <FooterColumn
                  key={item.id}
                  title={item.title.toLowerCase()}
                  links={item.items}
                  publicStoreDomain={publicStoreDomain}
                />
              );
            }
            return null;
          })}
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

/**
 * @param {{
 *   title: string;
 *   links: Array<{id: string, title: string, url: string}>;
 * }}
 */
function FooterColumn({title, links, publicStoreDomain}) {
  return (
    <div className="footer-column">
      <p className="footer-heading">{title}</p>
      {links.map((link) => {
        const url = link.url.includes(publicStoreDomain)
          ? new URL(link.url).pathname
          : link.url;

        return (
          <NavLink key={link.id} to={url}>
            {link.title.toLowerCase()}
          </NavLink>
        );
      })}
    </div>
  );
}

/**
 * @typedef {Object} FooterProps
 * @property {Promise<FooterQuery|null>} footer
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
