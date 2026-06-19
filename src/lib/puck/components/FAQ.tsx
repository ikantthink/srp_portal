"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useState } from "react";

export type FAQProps = {
  items: string;
};

export const FAQConfig: ComponentConfig<FAQProps> = {
  fields: {
    items: { type: "textarea" },
  },
  defaultProps: {
    items: "How do I get started?|Contact us for a free consultation and we'll guide you through every step.\nWhat areas do you serve?|We serve the greater metropolitan area and surrounding suburbs.\nDo you help with financing?|Yes, we have partnerships with several lenders to help find the best rates.",
  },
  render: ({ items }) => {
    const faqs = items.split("\n").filter(Boolean).map((line) => {
      const [q, a] = line.split("|");
      return { question: q?.trim(), answer: a?.trim() };
    });

    return (
      <section className="px-4 py-12 max-w-3xl mx-auto sm:px-6 sm:py-16">
        <h2 className="text-2xl font-bold text-center mb-8 sm:text-3xl sm:mb-10">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.question || ""} answer={faq.answer || ""} />
          ))}
        </div>
      </section>
    );
  },
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border">
      <button
        className="flex w-full items-center justify-between p-4 text-left font-medium"
        onClick={() => setOpen(!open)}
      >
        {question}
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground">{answer}</div>}
    </div>
  );
}
