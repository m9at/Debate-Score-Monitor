import { createClient } from "@base44/sdk";

export const base44 = createClient({
  appId: "6a89eb9c8435649fa86cf32b",
});

export const entities = base44.entities as any;
