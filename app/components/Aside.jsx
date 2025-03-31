import {createContext, useContext, useEffect, useState, useId} from 'react';
import {SearchFormPredictive} from './SearchFormPredictive';

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
              height="11"
              viewBox="0 0 10 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.180272 0.844771C0.152476 0.846054 0.125964 0.8576 0.106719 0.877271C0.085765 0.897798 0.0742188 0.925594 0.0742188 0.954673C0.0742188 0.983751 0.085765 1.01198 0.106719 1.0325L4.84529 5.77195L0.106719 10.511C0.085765 10.5315 0.0742188 10.5593 0.0742188 10.5884C0.0742188 10.6174 0.085765 10.6452 0.106719 10.6662C0.127246 10.6867 0.155042 10.6983 0.18412 10.6983C0.213199 10.6983 0.240995 10.6867 0.261522 10.6662L5.00053 5.92718L9.74041 10.6662C9.76094 10.6867 9.78873 10.6983 9.81781 10.6983C9.84689 10.6983 9.87469 10.6867 9.89521 10.6662C9.91617 10.6452 9.92771 10.6174 9.92771 10.5884C9.92771 10.5593 9.91617 10.5315 9.89521 10.511L5.15577 5.77195L9.89521 1.0325C9.91617 1.01198 9.92771 0.983752 9.92771 0.954673C9.92771 0.925593 9.91617 0.897798 9.89521 0.877271C9.87469 0.856745 9.84689 0.844771 9.81781 0.844771C9.78873 0.844771 9.76094 0.856745 9.74041 0.877271L5.00053 5.61672L0.261522 0.877271C0.24014 0.855462 0.210635 0.843916 0.180272 0.844771Z"
                fill="black"
              />
            </svg>
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

  return (
    <AsideContext.Provider
      value={{
        type,
        subType,
        open: (type, subType) => {
          setType(type);
          setSubType(subType);
        },
        close: () => setType('closed'),
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
 *   open: (mode: AsideType) => void;
 *   close: () => void;
 * }} AsideContextValue
 */

/** @typedef {import('react').ReactNode} ReactNode */
