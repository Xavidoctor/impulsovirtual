"use client";

import { useState } from "react";

type CopyEmailButtonProps = {
  email: string;
  label: string;
  className?: string;
};

export function CopyEmailButton({ email, label, className }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {copied ? "Correo copiado" : label}
    </button>
  );
}
