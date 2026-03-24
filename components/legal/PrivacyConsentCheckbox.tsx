"use client";

import Link from "next/link";

type PrivacyConsentCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  error?: string;
  className?: string;
};

export function PrivacyConsentCheckbox({
  checked,
  onChange,
  disabled = false,
  required = true,
  id = "privacy-consent",
  error,
  className,
}: PrivacyConsentCheckboxProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border border-white/25 bg-[#0b1114] accent-accent"
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>
          He leído y acepto la {" "}
          <Link href="/legal/privacidad" className="focus-ring underline decoration-white/30 underline-offset-4 hover:text-foreground">
            política de privacidad
          </Link>
          .
        </span>
      </label>

      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-red-200" role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}