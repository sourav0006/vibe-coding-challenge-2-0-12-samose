"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";

export interface ActivationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName?: string;
  playerEmail?: string;
  name?: string;
  email?: string;
  sportName?: string;
  code: string;
  expiresAt: string | Date;
  title?: string;
  description?: string;
  roleLabel?: string;
  onCreateAnother?: () => void;
  createAnotherLabel?: string;
}

export function ActivationCodeModal({
  isOpen,
  onClose,
  playerName,
  playerEmail,
  name,
  email,
  sportName,
  code,
  expiresAt,
  title = "Activation Code Generated",
  description,
  roleLabel = "User",
  onCreateAnother,
  createAnotherLabel,
}: ActivationCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const displayName = name || playerName || "";
  const displayEmail = email || playerEmail || "";
  const defaultDesc = `Provide this single-use code to the ${roleLabel.toLowerCase()} to activate their account.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formattedExpiry = new Date(expiresAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description || defaultDesc}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Account Details Summary */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">{roleLabel} Name:</span>
            <span className="font-semibold text-slate-900">{displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email Address:</span>
            <span className="font-semibold text-slate-900 font-mono">{displayEmail}</span>
          </div>
          {sportName && (
            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Sport:</span>
              <span className="font-semibold text-slate-900">{sportName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Code Expiration:</span>
            <span className="font-semibold text-amber-700">{formattedExpiry} (24 hours)</span>
          </div>
        </div>

        {/* Activation Code Display */}
        <div className="text-center py-5 px-6 bg-white border-2 border-dashed border-emerald-300 rounded-2xl space-y-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            One-Time Activation Code
          </span>
          <div className="font-mono text-3xl font-extrabold tracking-[0.25em] text-emerald-700 selection:bg-emerald-100">
            {code}
          </div>
          <div>
            <Button
              type="button"
              variant={copied ? "secondary" : "primary"}
              size="sm"
              onClick={handleCopy}
              className="gap-2 font-semibold text-xs shadow-xs"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-emerald-600" />
                  <span>Code Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                    />
                  </svg>
                  <span>Copy Activation Code</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
          <svg
            className="w-4 h-4 mt-0.5 shrink-0 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div>
            <strong>Important Security Notice:</strong> Share this activation code securely with the {roleLabel.toLowerCase()}. It can only be used once and expires in 24 hours. The plaintext code cannot be retrieved again after closing this window.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold">
            {onCreateAnother ? "Done" : "Done & Close"}
          </Button>
          {onCreateAnother && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onCreateAnother}
              className="text-xs font-semibold"
            >
              {createAnotherLabel || `Create Another ${roleLabel}`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
