"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-surface-0 shadow-xl"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
              <h2 className="font-semibold text-ink-primary">{title}</h2>
              <button onClick={onClose} className="btn-ghost px-2 py-2" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <div className="shrink-0 border-t p-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
