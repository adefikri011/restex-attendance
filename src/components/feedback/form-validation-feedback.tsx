"use client";

import { useEffect } from "react";
import { notifications } from "@/lib/notifications";

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function getFieldMessage(control: FormControl) {
  const label =
    control.labels?.[0]?.textContent?.trim().replace(/\s+/g, " ") ||
    control.getAttribute("aria-label") ||
    "Isian ini";
  const { validity } = control;
  const lengthControl =
    control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
      ? control
      : null;
  const input = control instanceof HTMLInputElement ? control : null;

  if (validity.valueMissing) {
    return `${label} ${control instanceof HTMLSelectElement ? "perlu dipilih" : "wajib diisi"}.`;
  }
  if (validity.typeMismatch && input?.type === "email") {
    return `${label} harus menggunakan format email yang benar.`;
  }
  if (validity.tooShort && lengthControl) {
    return `${label} belum mencapai panjang minimum ${lengthControl.minLength} karakter.`;
  }
  if (validity.tooLong && lengthControl) {
    return `${label} melebihi batas ${lengthControl.maxLength} karakter.`;
  }
  if (validity.rangeUnderflow && input) {
    return `${label} belum mencapai nilai minimum ${input.min}.`;
  }
  if (validity.rangeOverflow && input) {
    return `${label} melewati nilai maksimum ${input.max}.`;
  }
  if (validity.patternMismatch) {
    return `${label} belum sesuai dengan format yang diminta.`;
  }
  return `Periksa kembali ${label.toLowerCase()}.`;
}

export function FormValidationFeedback() {
  useEffect(() => {
    const messages = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;

    function handleInvalid(event: Event) {
      event.preventDefault();
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLSelectElement) &&
        !(target instanceof HTMLTextAreaElement)
      ) {
        return;
      }

      messages.add(getFieldMessage(target));
      if (timer !== null) return;

      timer = setTimeout(() => {
        const entries = Array.from(messages);
        const visibleMessages = entries.slice(0, 2);
        if (entries.length > visibleMessages.length) {
          visibleMessages.push(`dan ${entries.length - visibleMessages.length} isian lainnya.`);
        }
        notifications.warning(
          "Periksa kembali formulir",
          visibleMessages.join(" "),
          "form-validation",
        );
        messages.clear();
        timer = null;
      }, 0);
    }

    document.addEventListener("invalid", handleInvalid, true);
    return () => {
      document.removeEventListener("invalid", handleInvalid, true);
      if (timer !== null) clearTimeout(timer);
    };
  }, []);

  return null;
}
