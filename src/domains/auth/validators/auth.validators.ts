import { z } from "zod";

// ── Auth ──
export const otpSendSchema = z.object({
  action: z.literal("send"),
  email: z.string().email("Invalid email format"),
  tokenType: z.enum(["email_verification", "password_reset"]).optional(),
});

export const otpVerifySchema = z.object({
  action: z.literal("verify"),
  code: z.string().min(1, "OTP code is required"),
  email: z.string().email().optional(),
  tokenType: z.enum(["email_verification", "password_reset"]).optional(),
});

export const otpSchema = z.discriminatedUnion("action", [
  otpSendSchema,
  otpVerifySchema,
]);

export const onboardingSchema = z
  .object({
    step: z.enum(["set-email", "verify-email", "change-password"]),
    email: z.string().email().optional(),
    code: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (d) => d.step !== "change-password" || d.newPassword === d.confirmPassword,
    { message: "Passwords do not match", path: ["confirmPassword"] }
  );

export const forgotPasswordSchema = z.object({
  step: z.enum(["request", "verify", "reset"]),
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  code: z.string().optional(),
  resetToken: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});
