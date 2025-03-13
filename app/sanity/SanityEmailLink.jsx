import React from 'react';

function SanityEmailLink({value, children}) {
  return (
    <a href={`mailto:${value.email}`}>
      {children.map((child) => (
        <span key={child.key}>{child}</span>
      ))}
    </a>
  );
}

export default SanityEmailLink;
