import "server-only";
import { randomBytes } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { captcha } from "better-auth/plugins/captcha";
import { prisma } from "@/lib/prisma";

const isProductionRuntime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build";
const secret =
  process.env.BETTER_AUTH_SECRET?.trim() ||
  (isProductionRuntime ? "" : randomBytes(32).toString("base64url"));
const configuredBaseURL = process.env.BETTER_AUTH_URL?.trim();
const baseURL =
  configuredBaseURL ??
  (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000");

if (isProductionRuntime && secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters.");
}

if (isProductionRuntime && !baseURL) {
  throw new Error("BETTER_AUTH_URL must be set to the production application origin.");
}

if (baseURL) {
  const parsedBaseURL = new URL(baseURL);
  if (isProductionRuntime && parsedBaseURL.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use HTTPS in production.");
  }
}

const trustedOrigins = new Set(baseURL ? [new URL(baseURL).origin] : []);
const turnstileAllowedHostnames = new Set(
  baseURL ? [new URL(baseURL).hostname] : [],
);
if (process.env.NODE_ENV !== "production") {
  trustedOrigins.add("http://localhost:3000");
  trustedOrigins.add("http://127.0.0.1:3000");
  turnstileAllowedHostnames.add("localhost");
  turnstileAllowedHostnames.add("127.0.0.1");
  for (const origin of process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []) {
    const trimmedOrigin = origin.trim();
    if (trimmedOrigin) {
      const parsedOrigin = new URL(trimmedOrigin);
      trustedOrigins.add(parsedOrigin.origin);
      turnstileAllowedHostnames.add(parsedOrigin.hostname);
    }
  }
}

export const auth = betterAuth({
  appName: "RESTEX Attendance",
  baseURL,
  secret,
  trustedOrigins: [...trustedOrigins],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    modelName: "User",
    fields: {
      name: "name",
      email: "email",
      emailVerified: "emailVerified",
      image: "image",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "MEMBER",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },
  session: { modelName: "AuthSession" },
  account: { modelName: "Account" },
  verification: { modelName: "Verification" },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          return user?.isActive ? undefined : false;
        },
      },
    },
  },
  advanced: {
    useSecureCookies: isProductionRuntime,
    database: {
      generateId: "uuid",
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 5,
  },
  plugins: [
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim() ?? "",
      endpoints: ["/sign-in/email"],
      expectedAction: "login",
      allowedHostnames: [...turnstileAllowedHostnames],
    }),
  ],
});
