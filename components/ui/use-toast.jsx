"use client";

import { toast as sonnerToast } from 'sonner';

// Provides a compatible API with the previous toast implementation
export function toast({ title, description, variant = "default", ...props }) {
  // Map the variant to Sonner's styling
  const variantMap = {
    default: () => sonnerToast(title, { description, ...props }),
    success: () => sonnerToast.success(title, { description, ...props }),
    destructive: () => sonnerToast.error(title, { description, ...props }),
    warning: () => sonnerToast.warning(title, { description, ...props }),
    info: () => sonnerToast.info(title, { description, ...props }),
  };

  // Use the appropriate variant function or default to regular toast
  return (variantMap[variant] || variantMap.default)();
} 