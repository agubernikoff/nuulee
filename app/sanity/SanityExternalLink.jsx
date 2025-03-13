import React from 'react';

function SanityExternalLink({value, children}) {
  return (
    <a href={value.url} rel="noopener noreferrer" target="_blank">
      {children.map((child) => (
        <span key={child.key || child}>{child}</span>
      ))}
    </a>
  );
}

export default SanityExternalLink;
