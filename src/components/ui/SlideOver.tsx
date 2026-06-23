"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function SlideOver({
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
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative flex h-full w-full max-w-md flex-col border-l bg-surface-0 shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
              <h2 className="text-lg font-semibold text-ink-primary">{title}</h2>
              <button onClick={onClose} className="btn-ghost px-2 py-2" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="shrink-0 border-t bg-surface-0 p-4">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
