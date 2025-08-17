'use client';

import React from "react";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ value = 0, className = "", ...props }: ProgressProps) {
  return (
    <div className={`w-full bg-gray-200 rounded ${className}`} {...props}>
      <div className="bg-blue-500 h-full rounded" style={{ width: `${value}%` }} />
    </div>
  );
}
