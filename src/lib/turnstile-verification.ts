import "server-only";

type TurnstileResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export class TurnstileVerificationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function verifyTurnstileToken(
  token: unknown,
  expectedAction: string,
  requestHostname: string,
) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim() ?? "";
  if (!secret && process.env.NODE_ENV !== "production") {
    console.warn("Turnstile check is skipped because the local secret is unset.");
    return;
  }
  if (!secret) {
    console.error("Turnstile secret is missing.");
    throw new TurnstileVerificationError(
      "Verifikasi keamanan belum dikonfigurasi di server.",
      503,
    );
  }
  if (typeof token !== "string" || !token) {
    throw new TurnstileVerificationError(
      "Selesaikan verifikasi keamanan sebelum melanjutkan.",
      400,
    );
  }

  const body = new URLSearchParams({ secret, response: token });
  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
  } catch (error) {
    console.error("Turnstile verification request failed.", error);
    throw new TurnstileVerificationError(
      "Layanan verifikasi tidak dapat dihubungi. Silakan coba kembali.",
      503,
    );
  }
  if (!response.ok) {
    console.error("Turnstile verification returned an HTTP error.", {
      status: response.status,
    });
    throw new TurnstileVerificationError(
      "Layanan verifikasi sedang bermasalah. Silakan coba kembali.",
      503,
    );
  }

  let result: TurnstileResponse;
  try {
    const responseBody: unknown = await response.json();
    if (
      typeof responseBody !== "object" ||
      responseBody === null ||
      !("success" in responseBody) ||
      typeof responseBody.success !== "boolean"
    ) {
      throw new Error("Unexpected Turnstile response.");
    }
    result = responseBody as TurnstileResponse;
  } catch (error) {
    console.error("Turnstile verification returned an invalid response.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    throw new TurnstileVerificationError(
      "Layanan verifikasi mengirim respons yang tidak valid.",
      503,
    );
  }

  if (!result.success) {
    const errorCodes = result["error-codes"] ?? [];
    console.warn("Turnstile token was rejected.", { errorCodes });
    if (
      errorCodes.includes("invalid-input-secret") ||
      errorCodes.includes("missing-input-secret")
    ) {
      throw new TurnstileVerificationError(
        "Secret verifikasi di server tidak cocok. Hubungi pengelola website.",
        503,
      );
    }
    if (errorCodes.includes("timeout-or-duplicate")) {
      throw new TurnstileVerificationError(
        "Token verifikasi sudah kedaluwarsa atau pernah dipakai. Selesaikan CAPTCHA lagi.",
        400,
      );
    }
    if (errorCodes.includes("invalid-input-response")) {
      throw new TurnstileVerificationError(
        "CAPTCHA ditolak. Pastikan Site Key dan Secret Key berasal dari konfigurasi Turnstile yang sama.",
        400,
      );
    }
    throw new TurnstileVerificationError(
      "Token CAPTCHA ditolak. Selesaikan CAPTCHA sekali lagi.",
      400,
    );
  }

  // Development requests may expose the bind address instead of the browser hostname.
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  let allowedRequestHost = requestHostname.toLowerCase();
  try {
    const baseURL = process.env.BETTER_AUTH_URL?.trim();
    if (baseURL) {
      allowedRequestHost = new URL(baseURL).hostname.toLowerCase();
    }
  } catch (error) {
    console.error("BETTER_AUTH_URL is invalid for Turnstile hostname validation.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    throw new TurnstileVerificationError(
      "Alamat website belum dikonfigurasi dengan benar.",
      503,
    );
  }

  if (result.action !== expectedAction) {
    console.warn("Turnstile action did not match.", {
      action: result.action ?? null,
      expectedAction,
    });
    throw new TurnstileVerificationError(
      "CAPTCHA berasal dari formulir yang berbeda. Muat ulang halaman lalu coba lagi.",
      400,
    );
  }

  if (result.hostname?.toLowerCase() !== allowedRequestHost) {
    console.warn("Turnstile hostname did not match.", {
      hostname: result.hostname ?? null,
      allowedRequestHost,
    });
    throw new TurnstileVerificationError(
      "CAPTCHA tidak cocok dengan alamat website ini. Periksa domain yang diizinkan pada pengaturan Turnstile.",
      400,
    );
  }
}
