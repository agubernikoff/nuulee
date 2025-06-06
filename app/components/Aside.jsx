import {createContext, useContext, useEffect, useState, useId} from 'react';
import {SearchFormPredictive} from './SearchFormPredictive';
import x from '../assets/x.png';

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 * @param {{
 *   children?: React.ReactNode;
 *   type: AsideType;
 *   heading: React.ReactNode;
 *   id?: string;
 *   closeOnMouseLeave?: boolean;
 * }}
 */
export function Aside({children, heading, type, id, closeOnMouseLeave}) {
  const {type: activeType, subType, close} = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }

    return () => abortController.abort();
  }, [close, expanded]);

  const queriesDatalistId = useId();

  return (
    <div
      aria-modal
      className={`overlay ${expanded ? 'expanded' : ''}`}
      role="dialog"
    >
      <button className="close-outside" onClick={close} />
      <aside id={type} onMouseLeave={closeOnMouseLeave ? () => close() : null}>
        {/* Hide header on screens ≤ 499px */}
        <header className="aside-header">
          {type === 'search' ? (
            <SearchFormPredictive>
              {({fetchResults, goToSearch, inputRef}) => (
                <>
                  <input
                    name="q"
                    onChange={fetchResults}
                    onFocus={fetchResults}
                    placeholder="type something"
                    ref={inputRef}
                    type="search"
                    list={queriesDatalistId}
                  />
                  <button onClick={goToSearch} style={{display: 'none'}}>
                    Search
                  </button>
                </>
              )}
            </SearchFormPredictive>
          ) : (
            <p>{heading}</p>
          )}
          <button className="close reset" onClick={close} aria-label="Close">
            <svg
              width="10"
              height="8"
              viewBox="0 0 8.9 7.7"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="-3"
                y1="-4"
                x2="10"
                y2="10"
                stroke="black"
                strokeWidth="1"
              />
              <line
                x1="-3"
                y1="12"
                x2="10"
                y2="-2"
                stroke="black"
                strokeWidth="1"
              />
            </svg>
            {/* <img
              className="header-image"
              style={{width: '30%'}}
              src={x}
              alt="Menu"
            /> */}
          </button>
        </header>
        <main>{children}</main>
      </aside>
    </div>
  );
}

const AsideContext = createContext(null);

Aside.Provider = function AsideProvider({children}) {
  const [type, setType] = useState('closed');
  const [subType, setSubType] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 500px)');
    const handleChange = (e) => setIsMobile(e.matches);

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Scroll lock on mobile when aside is open
  useEffect(() => {
    if (isMobile && type !== 'closed') {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [type, isMobile]);

  return (
    <AsideContext.Provider
      value={{
        type,
        subType,
        open: (type, subType) => {
          setType(type);
          setSubType(subType);
        },
        close: () => {
          setType('closed');
        },
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}

/** @typedef {'search' | 'cart' | 'mobile' | 'closed'} AsideType */
/**
 * @typedef {{
 *   type: AsideType;
 *   open: (type: AsideType, subType?: string) => void;
 *   close: () => void;
 * }} AsideContextValue
 */

/** @typedef {import('react').ReactNode} ReactNode */
