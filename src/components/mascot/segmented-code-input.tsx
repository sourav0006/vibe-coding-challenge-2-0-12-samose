"use client";

import React, { useRef } from "react";

interface SegmentedActivationCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onTyping?: () => void;
  disabled?: boolean;
}

export function SegmentedActivationCodeInput({
  value,
  onChange,
  onFocus,
  onBlur,
  onTyping,
  disabled = false,
}: SegmentedActivationCodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Array of 8 characters (padded with empty strings)
  const digits = Array.from({ length: 8 }, (_, i) => value[i] || "");

  const handleInputChange = (index: number, char: string) => {
    const clean = char.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!clean && char !== "") return;

    const charToSet = clean.slice(-1);
    const newChars = [...digits];
    newChars[index] = charToSet;
    const newCode = newChars.join("").trimEnd();

    onChange(newCode);
    onTyping?.();

    // Auto-advance to next input if filled
    if (charToSet && index < 7) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move to previous box and clear it
        const newChars = [...digits];
        newChars[index - 1] = "";
        onChange(newChars.join("").trimEnd());
        inputsRef.current[index - 1]?.focus();
        onTyping?.();
        e.preventDefault();
      } else if (digits[index]) {
        const newChars = [...digits];
        newChars[index] = "";
        onChange(newChars.join("").trimEnd());
        onTyping?.();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < 7) {
      inputsRef.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8);

    if (pastedData) {
      onChange(pastedData);
      onTyping?.();
      const targetIndex = Math.min(pastedData.length, 7);
      inputsRef.current[targetIndex]?.focus();
    }
  };

  return (
    <div
      className="ims-code-grid"
      role="group"
      aria-label="8-character activation code"
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck="false"
          maxLength={2}
          value={digit}
          disabled={disabled}
          aria-label={`Activation code character ${i + 1} of 8`}
          className={`ims-code-digit ${digit ? "is-filled" : ""}`}
          onChange={(e) => handleInputChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

