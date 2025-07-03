import React, {useState, useEffect, useRef} from 'react';
import {Pagination} from '@shopify/hydrogen';
import {useNavigate, useLocation} from '@remix-run/react';

export function PaginatedResourceSection({
  connection,
  children,
  resourcesClassName,
}) {
  const loadMoreRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const {search} = useLocation();
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {rootMargin: '100px'},
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [search]);

  const nav = useNavigate();

  return (
    <Pagination connection={connection}>
      {({
        nodes,
        isLoading,
        hasNextPage,
        nextPageUrl,
        hasPreviousPage,
        PreviousLink,
        state,
      }) => {
        useEffect(() => {
          if (isIntersecting && hasNextPage && !isLoading) {
            nav(nextPageUrl, {
              replace: true,
              preventScrollReset: true,
              state,
            });
          }
        }, [isIntersecting, hasNextPage, isLoading, nextPageUrl, state]);

        const resourcesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );

        return (
          <div>
            <PreviousLink>
              {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
            </PreviousLink>
            {resourcesClassName ? (
              <div className={resourcesClassName}>{resourcesMarkup}</div>
            ) : (
              resourcesMarkup
            )}
            {hasNextPage && (
              <div
                ref={loadMoreRef}
                style={{textAlign: 'center', padding: '20px'}}
              >
                {isLoading ? 'Loading more...' : 'Scroll to load more'}
              </div>
            )}
          </div>
        );
      }}
    </Pagination>
  );
}
