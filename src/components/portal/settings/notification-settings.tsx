"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationSettingsProps {
  userId: string;
  eventTypes: { key: string; label: string }[];
  currentSettings: { event_type: string; channel: string; enabled: boolean }[];
  smsEnabled?: boolean;
}

export function NotificationSettings({
  userId,
  eventTypes,
  currentSettings,
  smsEnabled = true,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<Record<string, { email: boolean; sms: boolean }>>(
    () => {
      const map: Record<string, { email: boolean; sms: boolean }> = {};
      for (const et of eventTypes) {
        const emailSetting = currentSettings.find(
          (s) => s.event_type === et.key && s.channel === "email"
        );
        const smsSetting = currentSettings.find(
          (s) => s.event_type === et.key && s.channel === "sms"
        );
        map[et.key] = {
          email: emailSetting?.enabled ?? true,
          sms: smsSetting?.enabled ?? false,
        };
      }
      return map;
    }
  );

  async function toggle(eventType: string, channel: "email" | "sms") {
    const newValue = !settings[eventType]?.[channel];
    setSettings((prev) => ({
      ...prev,
      [eventType]: { ...prev[eventType], [channel]: newValue },
    }));

    const supabase = createClient();
    await supabase.from("notification_settings").upsert(
      {
        user_id: userId,
        event_type: eventType,
        channel,
        enabled: newValue,
      },
      { onConflict: "user_id,channel,event_type" }
    );
  }

  const gridCols = smsEnabled ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="space-y-1">
      {!smsEnabled && (
        <p className="px-4 pb-2 text-xs text-muted-foreground">
          SMS notifications are disabled by your administrator.
        </p>
      )}
      <div className={`grid ${gridCols} gap-4 px-4 py-2 text-sm font-medium text-muted-foreground`}>
        <div>Event</div>
        <div className="text-center">Email</div>
        {smsEnabled && <div className="text-center">SMS</div>}
      </div>
      {eventTypes.map((et) => (
        <div key={et.key} className={`grid ${gridCols} gap-4 rounded-lg px-4 py-3 hover:bg-muted/50`}>
          <div className="text-sm font-medium">{et.label}</div>
          <div className="text-center">
            <button
              onClick={() => toggle(et.key, "email")}
              className={`h-6 w-11 rounded-full transition-colors ${
                settings[et.key]?.email ? "bg-brand-primary" : "bg-border"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  settings[et.key]?.email ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          {smsEnabled && (
            <div className="text-center">
              <button
                onClick={() => toggle(et.key, "sms")}
                className={`h-6 w-11 rounded-full transition-colors ${
                  settings[et.key]?.sms ? "bg-brand-primary" : "bg-border"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings[et.key]?.sms ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
