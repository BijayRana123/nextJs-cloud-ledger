"use client";

import { toast as sonnerToast } from 'sonner';
import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast-hook"

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

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

export { useToast } 