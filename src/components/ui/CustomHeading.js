import React from 'react';
import { Great_Vibes } from 'next/font/google';

const greatVibes = Great_Vibes({ subsets: ['latin'], weight: ['400'] });

export default function CustomHeading({ title, subtitle, className = "" }) {
  return (
    <div className={className}>
      <h1 className={`text-[36px] text-[#001f3f] tracking-tight mb-1 ${greatVibes.className}`}>
        {title}
      </h1>
      <p className={`text-[15px]  text-[#5c728a]`}>
        {subtitle}
      </p>
    </div>
  );
}
