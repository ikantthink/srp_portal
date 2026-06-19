"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useState } from "react";

export type NewsletterSubscribeProps = {
  heading: string;
  description: string;
  buttonText: string;
};

export const NewsletterSubscribeConfig: ComponentConfig<NewsletterSubscribeProps> = {
  fields: {
    heading: { type: "text" },
    description: { type: "textarea" },
    buttonText: { type: "text" },
  },
  defaultProps: {
    heading: "Stay Updated",
    description: "Subscribe to our newsletter for market updates and new listings.",
    buttonText: "Subscribe",
  },
  render: ({ heading, description, buttonText }) => {
    return (
      <NewsletterSubscribeWidget
        heading={heading}
        description={description}
        buttonText={buttonText}
      />
    );
  },
};

function NewsletterSubscribeWidget({
  heading,
  description,
  buttonText,
}: NewsletterSubscribeProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="px-4 py-12 bg-brand-primary/5 sm:px-6 sm:py-16">
      <div className="max-w-xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold">{heading}</h2>
        <p className="text-muted-foreground">{description}</p>
        {status === "success" ? (
          <p className="text-emerald-600 font-medium">Thanks for subscribing!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md mx-auto sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 h-11 rounded-lg border border-border bg-background px-4 text-sm"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="h-11 rounded-lg bg-brand-primary px-6 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {status === "loading" ? "..." : buttonText}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
        )}
      </div>
    </section>
  );
}
