import React from 'react';

const Logo = () => {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="title"
      role="img"
    >
      <title>LineHub Logo</title>
      {/* Background circle in neutral gray */}
      <circle cx="32" cy="32" r="30" stroke="#FFFFFF" strokeWidth="4" fill="none" />
      {/* Queue or people stylized as three vertical bars/arrows in deep blue and royal purple */}
      <rect x="18" y="18" width="6" height="28" fill="#2C3E8F" />
      <rect x="29" y="12" width="6" height="34" fill="#5E35B1" />
      <rect x="40" y="22" width="6" height="24" fill="#2C3E8F" />
      {/* Minimal arrow pointing right, symbolizing flow and progress */}
      <path d="M24 48 L32 40 L40 48" stroke="#5E35B1" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Logo;
