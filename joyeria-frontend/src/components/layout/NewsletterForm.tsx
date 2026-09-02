"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="text-xs text-emerald-600 font-medium py-2">
        ¡Gracias por suscribirte!
      </p>
    );
  }

  return (
    <form className="w-full max-w-sm" onSubmit={handleSubmit}>
      <div className="flex items-center border border-gray-300 rounded-md bg-white px-3 py-2 focus-within:border-gray-900 transition-colors shadow-2xs">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          aria-label="Email para suscribirse al newsletter"
        />
        <button
          type="submit"
          className="text-gray-700 hover:text-black transition-colors px-1 cursor-pointer shrink-0"
          aria-label="Enviar suscripción"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </form>
  );
}
