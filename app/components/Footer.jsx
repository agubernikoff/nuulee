import {Suspense} from 'react';
import {Await} from '@remix-run/react';
import {useLocation} from 'react-router';
import {useEffect, useState} from 'react';
import NavLink from './NavLink';
import {useAside} from './Aside';

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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    window
      .matchMedia('(max-width:500px)')
      .addEventListener('change', (e) => setIsMobile(e.matches));
    if (window.matchMedia('(max-width:500px)').matches) setIsMobile(true);
  }, []);

  const {pathname} = useLocation();
  const [footerHeaderSubMenu, setFooterHeaderSubMenu] = useState(
    menu.items.find((sub) =>
      sub.items
        .map((link) => {
          link.url.includes(publicStoreDomain)
            ? new URL(link.url).pathname
            : link.url;
        })
        .includes(
          pathname.split('/').length > 3
            ? pathname
                .split('/')
                .filter((x, i) => i !== 1)
                .join('/')
            : pathname,
        ),
    ),
  );
  useEffect(() => {
    if (pathname.includes('pages'))
      setFooterHeaderSubMenu(
        menu.items.find(
          (sub) =>
            sub.items
              .map((link) =>
                link.url.includes(publicStoreDomain)
                  ? new URL(link.url).pathname
                  : link.url,
              )
              .includes(
                pathname.split('/').length > 3
                  ? pathname
                      .split('/')
                      .filter((x, i) => i !== 1)
                      .join('/')
                  : pathname,
              ) &&
            (sub.title === 'support' || sub.title === 'legal'),
        ),
      );
  }, [pathname]);

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
                  isMobile={isMobile}
                />
              );
            }
            return null;
          })}
        {pathname.includes('pages') ? (
          <FooterHeaderSubMenu
            links={footerHeaderSubMenu}
            publicStoreDomain={publicStoreDomain}
          />
        ) : null}
      </div>

      <div className="footer-info">
        <p className="footer-heading">
          © nüülee new york 2025, all rights reserved /{' '}
          <a href="https://www.swallstudios.com">site credit</a>
        </p>
        <p style={{maxWidth: '342px'}}>
          sustainability is at the heart of what we do. we prioritize{' '}
          <a href="/pages/sustainability" className="footer-link-underline">
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
function FooterColumn({title, links, publicStoreDomain, isMobile}) {
  const {open} = useAside();
  return (
    <div className="footer-column">
      <p className="footer-heading">{title}</p>
      {links.map((link) => {
        const url = link.url.includes(publicStoreDomain)
          ? new URL(link.url).pathname
          : link.url;

        return (
          <NavLink
            key={link.id}
            to={url}
            onClick={(e) => {
              if (link.title.toLowerCase() === 'subscribe') {
                e.preventDefault();
                if (!isMobile) open('subscribe');
                else open('mobile', 'choose country');
              }
            }}
          >
            {link.title.toLowerCase()}
          </NavLink>
        );
      })}
    </div>
  );
}

function FooterHeaderSubMenu({links, publicStoreDomain}) {
  if (links === undefined || links?.items?.length === 0) return null;
  return (
    <div className="footer-header-submenu">
      <nav className="footer-header-submenu-nav">
        {links?.items?.map((link) => {
          const url = link.url.includes(publicStoreDomain)
            ? new URL(link.url).pathname
            : link.url;

          return (
            <NavLink
              key={link.id}
              to={url}
              className="header-menu-item"
              style={activeLinkStyle}
              data-text={link.title.toLowerCase()}
            >
              <p>{link.title.toLowerCase()}</p>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

function activeLinkStyle({isActive, isPending}) {
  return {
    fontFamily: isActive ? 'medium' : undefined,
  };
}

/**
 * @typedef {Object} FooterProps
 * @property {Promise<FooterQuery|null>} footer
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
