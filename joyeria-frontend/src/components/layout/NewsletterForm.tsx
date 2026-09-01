"use client";

/**
 * components/layout/NewsletterForm.tsx
 * Formulario de suscripción al newsletter.
 * Client Component separado para poder manejar el onSubmit.
 * TODO: conectar con backend cuando se implemente el endpoint de newsletter.
 */

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: llamar al endpoint de newsletter cuando esté disponible
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="font-body text-sm text-petrucci-gold">
        ¡Gracias! Te avisamos cuando haya novedades.
      </p>
    );
  }

  return (
    <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        className="flex-1 px-4 py-2.5 border border-petrucci-border bg-white font-body text-sm text-petrucci-black placeholder:text-petrucci-gray focus:outline-none focus:border-petrucci-gold transition-colors"
        aria-label="Tu email para suscribirte al newsletter"
      />
      <button
        type="submit"
        className="px-6 py-2.5 bg-petrucci-black text-petrucci-cream font-body text-xs tracking-[0.15em] uppercase hover:bg-petrucci-gold transition-colors duration-200"
      >
        Suscribirme
      </button>
    </form>
  );
}
