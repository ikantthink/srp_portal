import type { ComponentConfig } from "@puckeditor/core";

export type ContactInfoProps = {
  address: string;
  phone: string;
  email: string;
  showMap: boolean;
};

export const ContactInfoConfig: ComponentConfig<ContactInfoProps> = {
  fields: {
    address: { type: "textarea" },
    phone: { type: "text" },
    email: { type: "text" },
    showMap: { type: "radio", options: [{ label: "Yes", value: true }, { label: "No", value: false }] },
  },
  defaultProps: { address: "123 Main St, City, State 12345", phone: "(555) 123-4567", email: "info@srpre.com", showMap: false },
  render: ({ address, phone, email }) => (
    <section className="px-4 py-12 max-w-4xl mx-auto sm:px-6">
      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground">Address</p>
          <p className="mt-1 whitespace-pre-wrap">{address}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground">Phone</p>
          <a href={`tel:${phone}`} className="mt-1 block text-brand-primary">{phone}</a>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground">Email</p>
          <a href={`mailto:${email}`} className="mt-1 block text-brand-primary">{email}</a>
        </div>
      </div>
    </section>
  ),
};
