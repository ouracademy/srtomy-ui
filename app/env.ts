import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_AUTH0_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_AUTH0_CLIENT_ID: z.string().min(1),
  NEXT_PUBLIC_AUTH0_AUDIENCE: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string(),
  // Origin of srtomy-agent (without /chat). Without it the AI assistant is
  // hidden, so the portal can ship before the agent is deployed.
  NEXT_PUBLIC_AGENT_URL: z.url({ protocol: /^https?$/ }).optional(),
});

// Next.js only inlines NEXT_PUBLIC_* when accessed as `process.env.NAME`, so
// each variable is listed explicitly instead of passing `process.env`.
const parsed = schema.safeParse({
  NEXT_PUBLIC_AUTH0_DOMAIN: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  NEXT_PUBLIC_AUTH0_CLIENT_ID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  NEXT_PUBLIC_AUTH0_AUDIENCE: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  // An empty value (a blank line in .env) means "not set", not an invalid URL.
  NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL || undefined,
});

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Invalid environment variables: ${missing}`);
}

export const env = parsed.data;
