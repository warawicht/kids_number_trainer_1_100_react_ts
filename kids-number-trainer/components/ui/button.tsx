'use client';

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  size?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", ...props }, ref) => (
    <button ref={ref} className={`px-4 py-2 rounded ${className}`} {...props} />
  )
);
Button.displayName = "Button";
