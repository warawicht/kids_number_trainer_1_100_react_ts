'use client';

import React from "react";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ onCheckedChange, className = "", ...props }: SwitchProps) {
  return (
    <input
      type="checkbox"
      className={`cursor-pointer ${className}`}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  );
}
