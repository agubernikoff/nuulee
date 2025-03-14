import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from '@remix-run/react';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {shop, menu} = header;
  return (
    <header className="header">
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderMenuMobileToggle />
      <NavLink
        prefetch="intent"
        to="/"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translate(-50%)',
        }}
        end
      >
        <Logo />
      </NavLink>
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const className = `header-menu-${viewport}`;
  const {close, open} = useAside();

  return (
    <nav className={className} role="navigation">
      {/* {viewport === 'mobile' && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )} */}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={(e) => {
              if (item.items && item.items.length > 0) e.preventDefault();
              else close();
            }}
            prefetch="intent"
            // style={activeLinkStyle}
            to={url}
            onMouseEnter={() => {
              if (item.items && item.items.length > 0 && viewport !== 'mobile')
                open('submenu', item.title);
              else if (item.items && viewport !== 'mobile') close();
            }}
            onMouseLeave={() => {}}
          >
            {item.title.toLowerCase()}
          </NavLink>
        );
      })}
    </nav>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav className="header-ctas" role="navigation">
      <SubscribeToggle />
      <LocationToggle />
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <h3>☰</h3>
    </button>
  );
}

function SubscribeToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-item reset"
      onMouseEnter={() => open('subscribe')}
    >
      subscribe
    </button>
  );
}

function LocationToggle() {
  const {open} = useAside();
  return (
    <button className="reset header-menu-item" onClick={() => open('location')}>
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
      </svg>
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button className="reset header-menu-item" onClick={() => open('search')}>
      <svg
        width="19"
        height="16"
        viewBox="0 0 19 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="6.91526" cy="7.12229" r="5.64573" stroke="black" />
        <line
          x1="11.5953"
          y1="10.2269"
          x2="17.741"
          y2="14.6167"
          stroke="black"
        />
      </svg>
    </button>
  );
}

/**
 * @param {{count: number | null}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      className="cart-link"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      <div className="cart-container">
        <svg
          width="22"
          height="16"
          viewBox="0 0 22 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="0.951172"
            y="4.18848"
            width="20.55"
            height="11.2116"
            stroke="black"
          />
          <path
            d="M5.98047 2.25363C5.98047 1.3396 6.72144 0.598633 7.63547 0.598633H14.8188C15.7328 0.598633 16.4738 1.3396 16.4738 2.25363V3.90863H5.98047V2.25363Z"
            stroke="black"
          />
        </svg>

        {/* Number inside the cart */}
        {count !== null && <span className="cart-count">{count}</span>}
      </div>
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

function Logo() {
  return (
    <svg
      width="75"
      height="36"
      viewBox="0 0 75 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_67_10875)">
        <path
          d="M5.25475 12.229C5.91905 11.8389 6.62035 11.6436 7.35866 11.6436C8.49797 11.6436 9.40979 12.0076 10.0953 12.7349C10.7802 13.4629 11.1236 14.5125 11.1236 15.8829V20.2812C11.1236 21.167 11.2183 21.8428 11.4081 22.3063C11.598 22.7704 11.8085 23.087 12.0409 23.2557C12.2726 23.4243 12.3891 23.4771 12.3891 23.414H7.83307C7.83307 23.4771 7.94894 23.4298 8.1813 23.2715C8.41304 23.1131 8.62416 22.8025 8.81405 22.3378C9.00393 21.8743 9.09857 21.1779 9.09857 20.2497V16.6425C9.09857 15.9254 9.00332 15.3563 8.81405 14.9341C8.62416 14.5125 8.37118 14.1642 8.0545 13.89C7.56917 13.4896 6.9892 13.2888 6.31459 13.2888C5.55505 13.2888 4.90107 13.537 4.35264 14.0326C3.80361 14.5282 3.53001 15.2192 3.53001 16.105V20.2503C3.53001 21.1572 3.62525 21.8434 3.81453 22.3069C4.00442 22.771 4.22039 23.0877 4.46306 23.2563C4.70512 23.425 4.82705 23.4777 4.82705 23.4146H0.27162C0.27162 23.4777 0.387493 23.4304 0.619845 23.2721C0.85159 23.1137 1.05725 22.7977 1.23682 22.3226C1.41579 21.8482 1.50557 21.1572 1.50557 20.2503V15.4722C1.50557 14.5865 1.36301 13.9804 1.07848 13.6528C0.793957 13.3258 0.471819 13.1626 0.113281 13.1626L3.53062 11.6436V13.7954C4.01534 13.142 4.59046 12.6197 5.25475 12.229Z"
          fill="black"
        />
        <path
          d="M19.8883 23.7939C18.8127 23.7939 17.9263 23.4403 17.2305 22.7341C16.5346 22.0273 16.1864 20.9463 16.1864 19.4909V14.9979C16.1864 14.1334 16.0542 13.4685 15.7909 13.0044C15.527 12.5409 15.2261 12.2243 14.8894 12.055C14.5515 11.8864 14.3828 11.8336 14.3828 11.8967H18.2115V19.0159C18.2115 20.0078 18.4802 20.7673 19.0183 21.2939C19.5564 21.8211 20.194 22.085 20.9323 22.085C21.6707 22.085 22.3295 21.8375 22.9101 21.3412C23.49 20.8456 23.78 20.197 23.78 19.395V14.7753C23.78 13.9527 23.6745 13.3308 23.4633 12.9086C23.2522 12.487 23.0096 12.2018 22.7354 12.0544C22.4611 11.907 22.324 11.8542 22.324 11.8961H25.8045V19.8379C25.8045 20.7236 25.947 21.3303 26.2316 21.6573C26.5161 21.9849 26.8376 22.1475 27.1968 22.1475H27.3866L23.7794 23.7927V21.5778C22.7244 23.0544 21.4274 23.7927 19.8877 23.7927L19.8883 23.7939ZM17.5939 7.59361C17.3724 7.34063 17.2614 7.04519 17.2614 6.70788C17.2614 6.37058 17.3724 6.07513 17.5939 5.82215C17.8153 5.56918 18.1162 5.44238 18.4954 5.44238C18.8745 5.44238 19.1755 5.56918 19.3969 5.82215C19.6183 6.07513 19.7293 6.37118 19.7293 6.70788C19.7293 7.04458 19.6183 7.34063 19.3969 7.59361C19.1755 7.84659 18.8745 7.97338 18.4954 7.97338C18.1162 7.97338 17.8153 7.84659 17.5939 7.59361ZM22.5303 7.59361C22.3089 7.34063 22.1978 7.04519 22.1978 6.70788C22.1978 6.37058 22.3089 6.07513 22.5303 5.82215C22.7517 5.56918 23.0526 5.44238 23.4318 5.44238C23.811 5.44238 24.1119 5.56918 24.3333 5.82215C24.5547 6.07513 24.6658 6.37118 24.6658 6.70788C24.6658 7.04458 24.5547 7.34063 24.3333 7.59361C24.1119 7.84659 23.811 7.97338 23.4318 7.97338C23.0526 7.97338 22.7517 7.84659 22.5303 7.59361Z"
          fill="black"
        />
        <path
          d="M34.5699 23.7939C33.4943 23.7939 32.608 23.4403 31.9121 22.7341C31.2163 22.0273 30.8681 20.9463 30.8681 19.4909V14.9979C30.8681 14.1334 30.7358 13.4685 30.4725 13.0044C30.2086 12.5409 29.9077 12.2243 29.571 12.055C29.2331 11.8864 29.0645 11.8336 29.0645 11.8967H32.8931V19.0159C32.8931 20.0078 33.1619 20.7673 33.7 21.2939C34.2381 21.8211 34.8757 22.085 35.614 22.085C36.3523 22.085 37.0111 21.8375 37.5917 21.3412C38.1717 20.8456 38.4617 20.197 38.4617 19.395V14.7753C38.4617 13.9527 38.3561 13.3308 38.145 12.9086C37.9339 12.487 37.6912 12.2018 37.417 12.0544C37.1428 11.907 37.0057 11.8542 37.0057 11.8961H40.4861V19.8379C40.4861 20.7236 40.6281 21.3303 40.9132 21.6573C41.1977 21.9849 41.5192 22.1475 41.8784 22.1475H42.0683L38.4611 23.7927V21.5778C37.4061 23.0544 36.1084 23.7927 34.5693 23.7927L34.5699 23.7939ZM32.2761 7.59361C32.0547 7.34063 31.9437 7.04519 31.9437 6.70788C31.9437 6.37058 32.0547 6.07513 32.2761 5.82215C32.4976 5.56918 32.7985 5.44238 33.1776 5.44238C33.5568 5.44238 33.8577 5.56918 34.0791 5.82215C34.3006 6.07513 34.4116 6.37118 34.4116 6.70788C34.4116 7.04458 34.3006 7.34063 34.0791 7.59361C33.8577 7.84659 33.5568 7.97338 33.1776 7.97338C32.7985 7.97338 32.4976 7.84659 32.2761 7.59361ZM37.2119 7.59361C36.9905 7.34063 36.8795 7.04519 36.8795 6.70788C36.8795 6.37058 36.9905 6.07513 37.2119 5.82215C37.4334 5.56918 37.7343 5.44238 38.1134 5.44238C38.4926 5.44238 38.7935 5.56918 39.0149 5.82215C39.2364 6.07513 39.3474 6.37118 39.3474 6.70788C39.3474 7.04458 39.2364 7.34063 39.0149 7.59361C38.7935 7.84659 38.4926 7.97338 38.1134 7.97338C37.7343 7.97338 37.4334 7.84659 37.2119 7.59361Z"
          fill="black"
        />
        <path
          d="M45.1199 2.13606C44.8354 1.80907 44.5133 1.64588 44.1547 1.64588H43.9648L47.5721 0V20.2504C47.5721 21.1786 47.6673 21.8751 47.8566 22.3385C48.0465 22.8026 48.257 23.1139 48.4893 23.2722C48.7211 23.4305 48.8376 23.4779 48.8376 23.4148H44.2809C44.2809 23.4779 44.3968 23.4305 44.6291 23.2722C44.8609 23.1139 45.072 22.7978 45.2619 22.3228C45.4518 21.8484 45.5464 21.1574 45.5464 20.2504V3.95484C45.5464 3.06911 45.4045 2.46305 45.1193 2.13545L45.1199 2.13606Z"
          fill="black"
        />
        <path
          d="M53.9021 22.956C53.0795 22.3973 52.4516 21.6693 52.0196 20.7726C51.5871 19.876 51.3711 18.9217 51.3711 17.9092C51.3711 16.6018 51.6295 15.4728 52.1464 14.5234C52.6633 13.574 53.333 12.8575 54.1557 12.3716C54.9783 11.8868 55.8325 11.6436 56.7188 11.6436C57.9843 11.6436 59.0763 12.1022 59.9936 13.0201C60.9109 13.9373 61.412 15.2089 61.4963 16.833H53.27C53.27 17.8455 53.4598 18.7367 53.8396 19.5065C54.2194 20.277 54.7308 20.8673 55.3745 21.2786C56.0175 21.6899 56.7194 21.8956 57.4784 21.8956C59.461 21.8956 60.8005 21.2628 61.4969 19.9973C61.307 21.1366 60.7901 22.0539 59.9463 22.7503C59.1024 23.4462 58.0687 23.7944 56.8456 23.7944C55.7063 23.7944 54.7253 23.5147 53.9027 22.956H53.9021ZM54.3765 13.5588C53.7856 14.1394 53.4271 14.8928 53.3009 15.821H59.0593C59.0593 14.851 58.8009 14.086 58.284 13.5272C57.7671 12.9685 57.1714 12.6888 56.4962 12.6888C55.6736 12.6888 54.9662 12.9788 54.3765 13.5588Z"
          fill="black"
        />
        <path
          d="M66.5583 22.956C65.7357 22.3973 65.1078 21.6693 64.6759 20.7726C64.2433 19.876 64.0273 18.9217 64.0273 17.9092C64.0273 16.6018 64.2858 15.4728 64.8027 14.5234C65.3195 13.574 65.9893 12.8575 66.8119 12.3716C67.6346 11.8868 68.4887 11.6436 69.3751 11.6436C70.6406 11.6436 71.7326 12.1022 72.6498 13.0201C73.5671 13.9373 74.0682 15.2089 74.1526 16.833H65.9262C65.9262 17.8455 66.1161 18.7367 66.4959 19.5065C66.8756 20.277 67.387 20.8673 68.0307 21.2786C68.6738 21.6899 69.3757 21.8956 70.1346 21.8956C72.1172 21.8956 73.4567 21.2628 74.1532 19.9973C73.9633 21.1366 73.4464 22.0539 72.6025 22.7503C71.7587 23.4462 70.7249 23.7944 69.5019 23.7944C68.3626 23.7944 67.3816 23.5147 66.5589 22.956H66.5583ZM67.0327 13.5588C66.4419 14.1394 66.0833 14.8928 65.9571 15.821H71.7156C71.7156 14.851 71.4571 14.086 70.9403 13.5272C70.4234 12.9685 69.8276 12.6888 69.1524 12.6888C68.3298 12.6888 67.6224 12.9788 67.0327 13.5588Z"
          fill="black"
        />
        <path
          d="M18.5029 34.4176L18.523 30.8188C18.523 30.7382 18.506 30.6775 18.4726 30.6374C18.4392 30.5974 18.3749 30.5768 18.2809 30.5768V30.4561H19.49V30.5768C19.3286 30.5768 19.2479 30.6575 19.2479 30.8188V35.3943C19.2479 35.475 19.2649 35.535 19.2983 35.5757C19.3316 35.6157 19.3959 35.6364 19.49 35.6364V35.7571H18.2002V35.6364C18.3343 35.6364 18.4016 35.6097 18.4016 35.5557C18.4016 35.5223 18.3865 35.4853 18.3561 35.4446C18.3258 35.404 18.3076 35.3773 18.3009 35.364L14.7131 31.2823V35.3943C14.7131 35.475 14.7301 35.535 14.7635 35.5757C14.7968 35.6157 14.8605 35.6364 14.9552 35.6364V35.7571H13.7461V35.6364C13.9075 35.6364 13.9882 35.5557 13.9882 35.3943V30.8188C13.9882 30.7382 13.9712 30.6775 13.9378 30.6374C13.9044 30.5974 13.8401 30.5768 13.7461 30.5768V30.4561H15.449V30.5768C15.321 30.5768 15.2573 30.6138 15.2573 30.6878C15.2573 30.7212 15.284 30.7648 15.3386 30.8188L18.5023 34.4176H18.5029Z"
          fill="black"
        />
        <path
          d="M21.7187 31.7172C21.7187 31.6232 21.7102 31.5522 21.6932 31.5049C21.6762 31.4582 21.6077 31.4345 21.4863 31.4345V31.3138H25.5479C25.716 31.3138 25.7997 31.2367 25.7997 31.082H25.9204V32.1303H25.7997C25.7997 31.9623 25.7154 31.8786 25.5479 31.8786H22.3836V33.1987H24.6106C24.7787 33.1987 24.8624 33.118 24.8624 32.9566H24.9831V34.0049H24.8624C24.8624 33.8436 24.7781 33.7629 24.6106 33.7629H22.3836V35.194H25.659C25.827 35.194 25.9107 35.1133 25.9107 34.9519H26.0314V36.0003H25.9107C25.9107 35.8389 25.8264 35.7582 25.659 35.7582H21.4869V35.6375C21.581 35.6375 21.6435 35.6193 21.6732 35.5817C21.7035 35.5446 21.7187 35.4688 21.7187 35.3542V31.7172Z"
          fill="black"
        />
        <path
          d="M28.5417 35.7544V35.6336C28.6424 35.6336 28.7043 35.627 28.728 35.6136C28.7516 35.6003 28.7631 35.5669 28.7631 35.5129C28.7631 35.4929 28.7498 35.4522 28.7231 35.3922C28.6964 35.3315 28.6758 35.2781 28.6624 35.2308L27.2416 31.7037C27.1743 31.5223 27.0772 31.4319 26.9492 31.4319V31.3112H28.0982V31.4319C27.9975 31.4319 27.9253 31.4386 27.8817 31.4525C27.838 31.4665 27.8161 31.4974 27.8161 31.5453C27.8161 31.5732 27.8246 31.606 27.8422 31.6436C27.8598 31.6818 27.8786 31.7249 27.8999 31.7728L29.1138 34.7873L30.2337 31.7637C30.2743 31.6533 30.295 31.5799 30.295 31.5453C30.295 31.4695 30.2246 31.4313 30.0832 31.4313V31.3105H31.2923V31.4313C31.151 31.4313 31.0806 31.4592 31.0806 31.5144C31.0806 31.5211 31.1043 31.5975 31.1522 31.7431L32.28 34.7934L33.3362 31.8232C33.378 31.6855 33.3993 31.5993 33.3993 31.5653C33.3993 31.4762 33.3119 31.4313 33.1372 31.4313V31.3105H34.2862V31.4313C34.1248 31.4313 34.0241 31.495 33.9841 31.623L32.7143 35.2308C32.6943 35.2915 32.6773 35.343 32.664 35.3867C32.6506 35.4304 32.644 35.4692 32.644 35.5026C32.644 35.59 32.7143 35.6336 32.8557 35.6336V35.7544H31.7673V35.6336C31.9087 35.6336 31.9791 35.6003 31.9791 35.5329C31.9791 35.5062 31.9657 35.4577 31.939 35.3867C31.9123 35.3163 31.8917 35.2642 31.8784 35.2308L30.6693 32.1368L29.5706 35.2205C29.5506 35.2812 29.5318 35.3382 29.5154 35.3916C29.4984 35.4456 29.4899 35.4856 29.4899 35.5123C29.4899 35.5596 29.5154 35.5948 29.5658 35.6179C29.6161 35.6415 29.6646 35.6464 29.712 35.633V35.7537H28.5429L28.5417 35.7544Z"
          fill="black"
        />
        <path
          d="M39.9974 35.7559V35.6351C40.1588 35.6351 40.2394 35.5545 40.2394 35.3931V33.5591L38.2945 30.9189C38.1938 30.7849 38.1161 30.6939 38.0627 30.6472C38.0087 30.6004 37.9414 30.5768 37.8613 30.5768V30.4561H39.3834V30.5768C39.2154 30.5768 39.1317 30.6241 39.1317 30.7175C39.1317 30.7442 39.1481 30.78 39.182 30.8231C39.2154 30.8668 39.256 30.9189 39.3034 30.979L40.6975 32.8712L42.162 30.9165C42.2099 30.8631 42.2463 30.8201 42.2706 30.7867C42.2942 30.7533 42.307 30.7236 42.307 30.6969C42.307 30.6168 42.2329 30.5768 42.0849 30.5768V30.4561H43.5361V30.5768C43.4487 30.5768 43.3795 30.5968 43.3292 30.6374C43.2788 30.6775 43.1963 30.7721 43.0823 30.9195L41.087 33.5597V35.3937C41.087 35.4744 41.1033 35.5344 41.1373 35.5751C41.1707 35.6151 41.2344 35.6357 41.329 35.6357V35.7565H39.9986L39.9974 35.7559Z"
          fill="black"
        />
        <path
          d="M49.4032 33.5388C49.4032 34.177 49.1696 34.7163 48.7031 35.1561C48.236 35.596 47.6233 35.8162 46.8637 35.8162C46.1042 35.8162 45.4914 35.5978 45.0243 35.161C44.5572 34.7242 44.3242 34.1836 44.3242 33.5382C44.3242 32.8927 44.5572 32.3606 45.0243 31.9208C45.4914 31.481 46.1042 31.2607 46.8637 31.2607C47.6233 31.2607 48.236 31.4791 48.7031 31.9159C49.1702 32.3527 49.4032 32.8933 49.4032 33.5388ZM44.9891 33.5291C44.9891 34.0192 45.1602 34.4293 45.503 34.7588C45.8457 35.0882 46.2989 35.2526 46.8637 35.2526C47.4285 35.2526 47.8817 35.0882 48.2245 34.7588C48.5672 34.4299 48.7383 34.0198 48.7383 33.5291C48.7383 33.0383 48.5672 32.6318 48.2245 32.3097C47.8817 31.9869 47.4285 31.8262 46.8637 31.8262C46.2989 31.8262 45.8457 31.9875 45.503 32.3097C45.1602 32.6324 44.9891 33.0389 44.9891 33.5291Z"
          fill="black"
        />
        <path
          d="M51.7594 35.3521C51.7594 35.4662 51.7746 35.542 51.8049 35.579C51.8353 35.616 51.9038 35.6342 52.0118 35.6342V35.755H50.8828V35.6342C50.9835 35.6342 51.0509 35.6172 51.0842 35.5839C51.1176 35.5505 51.1346 35.4729 51.1346 35.3515V31.7146C51.1346 31.5999 51.1194 31.5247 51.0891 31.4871C51.0587 31.4501 50.9902 31.4313 50.8828 31.4313V31.3105H53.9665C54.3899 31.3105 54.7072 31.4204 54.9189 31.6394C55.1307 31.8584 55.2362 32.1641 55.2362 32.5554C55.2362 32.9467 55.1307 33.2452 54.9189 33.4509C54.7072 33.6565 54.4063 33.7596 54.0168 33.7596L55.1252 35.4528C55.2059 35.5736 55.2896 35.6342 55.377 35.6342V35.755H54.2886V35.6342C54.3626 35.6342 54.4081 35.6294 54.4251 35.6191C54.4415 35.6088 54.45 35.5869 54.45 35.5529C54.45 35.519 54.4148 35.4377 54.3444 35.3085L53.3544 33.7596H51.7594V35.3521ZM51.7594 33.1954H53.9058C54.1412 33.1954 54.3105 33.1427 54.4148 33.0383C54.5191 32.934 54.5713 32.7659 54.5713 32.5354C54.5713 32.2848 54.5173 32.1059 54.4099 31.9973C54.3026 31.8887 54.1006 31.8347 53.8051 31.8347H51.7594V33.1954Z"
          fill="black"
        />
        <path
          d="M57.9169 35.3521C57.9169 35.4668 57.9321 35.542 57.9624 35.579C57.9927 35.616 58.0613 35.6342 58.1687 35.6342V35.755H57.0397V35.6342C57.1404 35.6342 57.2077 35.6172 57.2411 35.5839C57.2744 35.5505 57.2914 35.4729 57.2914 35.3515V31.7146C57.2914 31.5999 57.2763 31.5247 57.2459 31.4871C57.2156 31.4501 57.147 31.4313 57.0391 31.4313V31.3105H58.1681V31.4313C58.0674 31.4313 58 31.4483 57.9666 31.4822C57.9333 31.5162 57.9163 31.5939 57.9163 31.7152V33.2555L60.0123 31.6934C60.1064 31.6303 60.1531 31.5781 60.1531 31.5362C60.1531 31.4665 60.0687 31.4313 59.9013 31.4313V31.3105H61.4331V31.4313C61.3057 31.4313 61.1886 31.4792 61.0819 31.5744L59.3972 32.8424L61.2511 35.4019C61.3118 35.4892 61.367 35.5499 61.4173 35.5833C61.4677 35.6166 61.5435 35.6336 61.6442 35.6336V35.7544H60.3642V35.6336C60.5322 35.6336 60.616 35.6069 60.616 35.5529C60.616 35.5129 60.5759 35.4353 60.4952 35.3212L58.924 33.1694L57.9151 33.9592V35.3515L57.9169 35.3521Z"
          fill="black"
        />
      </g>
      <defs>
        <clipPath id="clip0_67_10875">
          <rect
            width="74.0384"
            height="36"
            fill="white"
            transform="translate(0.113281)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
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
    color: isPending ? 'grey' : 'black',
  };
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
