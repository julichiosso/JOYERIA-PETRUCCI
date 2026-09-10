"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="h-10 flex items-center">
        <p className="text-xs text-emerald-800 font-medium bg-emerald-50 border border-emerald-200/70 rounded-full px-4 py-2 w-full text-center">
          ✓ ¡Gracias por suscribirte al newsletter!
        </p>
      </div>
    );
  }

  return (
    <form className="w-full max-w-sm" onSubmit={handleSubmit} noValidate>
      <div className="relative flex items-center w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingresá tu email"
          required
          className="w-full h-10 pl-4 pr-11 py-2 bg-white border border-gray-300 rounded-full font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-all"
          aria-label="Email para suscribirse al newsletter"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors p-1 cursor-pointer flex items-center justify-center shrink-0"
          aria-label="Enviar suscripción"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="12" x2="20" y2="12" />
            <polyline points="14 6 20 12 14 18" />
          </svg>
        </button>
      </div>
    </form>
  );
}
