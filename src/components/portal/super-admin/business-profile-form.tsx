"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessProfile } from "@/actions/business-profile";
import type { BusinessProfile } from "@/lib/seo/business-profile";

export function BusinessProfileForm({ profile }: { profile: BusinessProfile }) {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [street, setStreet] = useState(profile.street);
  const [city, setCity] = useState(profile.city);
  const [region, setRegion] = useState(profile.region);
  const [postalCode, setPostalCode] = useState(profile.postalCode);
  const [areasServed, setAreasServed] = useState(profile.areasServed.join(", "));
  const [brokerage, setBrokerage] = useState(profile.brokerage);
  const [agents, setAgents] = useState(
    profile.agents
      .map((agent) => (agent.title ? `${agent.name}|${agent.title}` : agent.name))
      .join("\n")
  );
  const [sameAs, setSameAs] = useState(profile.sameAs.join("\n"));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateBusinessProfile({
      name,
      description,
      phone,
      email,
      street,
      city,
      region,
      postalCode,
      areasServed,
      brokerage,
      agents,
      sameAs,
    });

    setLoading(false);
    if ("error" in result && result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Business profile saved." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="organization"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Used as the home page description when a page doesn&apos;t set its own.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">Street</Label>
        <Input
          id="street"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          autoComplete="street-address"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">State</Label>
          <Input
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            autoComplete="postal-code"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="areasServed">Areas served</Label>
        <Input
          id="areasServed"
          value={areasServed}
          onChange={(e) => setAreasServed(e.target.value)}
          placeholder="Anchorage, Alaska"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated. The first area is used in the home page title.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brokerage">Brokerage</Label>
        <Input
          id="brokerage"
          value={brokerage}
          onChange={(e) => setBrokerage(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agents">Agents</Label>
        <Textarea
          id="agents"
          value={agents}
          onChange={(e) => setAgents(e.target.value)}
          rows={4}
          placeholder="Sydney Roth-Peterson|Real Estate Agent"
        />
        <p className="text-xs text-muted-foreground">
          One per line, as Name|Title.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sameAs">Profile URLs</Label>
        <Textarea
          id="sameAs"
          value={sameAs}
          onChange={(e) => setSameAs(e.target.value)}
          rows={5}
          placeholder={"https://www.zillow.com/profile/...\nhttps://www.facebook.com/..."}
        />
        <p className="text-xs text-muted-foreground">
          One https link per line: Google Business Profile, Zillow, Realtor.com,
          Facebook, Instagram, LinkedIn, YouTube. These tell search engines
          which other profiles are the same business.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Business Profile
        </Button>
        {message && (
          <span
            className={
              message.type === "success"
                ? "text-sm text-emerald-600"
                : "text-sm text-red-500"
            }
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
