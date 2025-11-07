import {motion, useScroll} from 'framer-motion';
import {useLocation} from '@remix-run/react';
import {useEffect, useState} from 'react';

export function AnimatedHeader({
  children,
  forceVisible = false,
  isDev,
  asideOpen = false,
}) {
  if (!isDev)
    return (
      <header className="header" style={{background: 'white'}}>
        {children}
      </header>
    );
  const {scrollY} = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const {pathname} = useLocation();

  // ✅ Effect 1: Force visible on non-home pages
  useEffect(() => {
    if (pathname !== '/') {
      setIsVisible(true);
    } else setIsVisible(false);
  }, [pathname]);

  // ✅ Effect 2: Only listen to scroll on the homepage
  useEffect(() => {
    if (!asideOpen && scrollY.current === 0) setIsVisible(false);
    if (pathname !== '/') return; // <-- skip scroll listener

    return scrollY.on('change', (y) => {
      if (y > 1) setIsVisible(true);
      else if (!forceVisible && !asideOpen) setIsVisible(false);
    });
  }, [scrollY, forceVisible, pathname, asideOpen]);

  const baseStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    paddingTop: '10px',
    paddingBottom: '10px',
    position: pathname === '/' ? 'fixed' : 'sticky',
    top: 0,
    width: 'calc(100% - 2.6rem)',
    zIndex: 100,
  };

  return (
    <motion.header
      className="header"
      animate={isVisible || forceVisible ? 'visible' : 'clear'}
      variants={{
        clear: {
          backgroundColor: 'rgba(255,255,255,0)',
          color: '#ffffff',
        },
        visible: {
          backgroundColor: 'rgba(255,255,255,1)',
          color: '#2a0e39',
        },
      }}
      transition={{duration: 0.4, ease: 'easeInOut'}}
      style={baseStyle}
      onMouseEnter={() => setIsVisible(true)}
      onMouseMove={() => setIsVisible(true)}
    >
      {children}
    </motion.header>
  );
}
