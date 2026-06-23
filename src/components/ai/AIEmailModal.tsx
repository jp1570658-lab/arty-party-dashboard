"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button, Spinner } from "@/components/ui/primitives";

export interface EmailRequest {
  type: "collab" | "invite";
  event?: Record<string, unknown>;
  recipient?: Record<string, unknown>;
}

export function AIEmailModal({
  open,
  onClose,
  request,
  title,
}: {
  open: boolean;
  onClose: () => void;
  request: EmailRequest | null;
  title: string;
}) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!request) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setEmail(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && request) {
      setEmail("");
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function copy() {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={generate} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
          <Button onClick={copy} disabled={!email || loading}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-ink-secondary">
          <Spinner />
          <Sparkles className="h-4 w-4 text-brand-purple" />
          Drafting your email…
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <pre className="whitespace-pre-wrap font-sans text-sm text-ink-primary">
          {email}
        </pre>
      )}
    </Modal>
  );
}
