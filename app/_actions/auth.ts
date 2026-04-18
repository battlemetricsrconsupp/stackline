"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createUserAccount, loginUser, logoutUser } from "@/lib/auth";

export type FormState = {
  message?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, string | string[]>;
};

const signupSchema = z.object({
  email: z.email("Enter a valid email address."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be 20 characters or less."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-zA-Z]/, "Password must include a letter.")
    .regex(/[0-9]/, "Password must include a number."),
  age: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value || (!Number.isNaN(Number(value)) && Number(value) >= 13 && Number(value) <= 99),
      {
        message: "Age must be between 13 and 99.",
      }
    ),
  region: z.string().trim().min(1, "Choose your region."),
  timezone: z.string().trim().min(1, "Add your timezone."),
  languages: z
    .array(z.string().trim().min(1))
    .min(1, "Pick at least one language.")
    .max(3, "Pick up to three languages."),
  playstyles: z
    .array(z.string().trim().min(1))
    .min(1, "Pick at least one playstyle.")
    .max(3, "Pick up to three playstyles."),
  selectedGames: z
    .array(z.string().trim().min(1))
    .min(1, "Pick at least one game.")
    .max(5, "Pick up to five games for now."),
});

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export async function signupAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const values = {
    email: String(formData.get("email") || ""),
    username: String(formData.get("username") || ""),
    age: String(formData.get("age") || ""),
    region: String(formData.get("region") || ""),
    timezone: String(formData.get("timezone") || ""),
    languages: formData.getAll("languages").map((value) => String(value)),
    playstyles: formData.getAll("playstyles").map((value) => String(value)),
    selectedGames: formData.getAll("selectedGames").map((value) => String(value)),
  } satisfies Record<string, string | string[]>;

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    age: formData.get("age"),
    region: formData.get("region"),
    timezone: formData.get("timezone"),
    languages: formData.getAll("languages"),
    playstyles: formData.getAll("playstyles"),
    selectedGames: formData.getAll("selectedGames"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: parsed.data.email.toLowerCase() },
        { username: parsed.data.username },
      ],
    },
  });

  if (existing) {
    return {
      message:
        existing.email === parsed.data.email.toLowerCase()
          ? "That email already has an account."
          : "That username is already taken.",
      values,
    };
  }

  await createUserAccount({
    email: parsed.data.email,
    username: parsed.data.username,
    password: parsed.data.password,
    age: parsed.data.age ? Number(parsed.data.age) : null,
    region: parsed.data.region,
    timezone: parsed.data.timezone,
    languages: parsed.data.languages,
    playstyles: parsed.data.playstyles,
    selectedGames: parsed.data.selectedGames,
  });
  redirect("/onboarding");
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await loginUser(parsed.data);
  if (!user) {
    return { message: "Email or password did not match." };
  }

  if ("blockedFromLogin" in user && user.blockedFromLogin) {
    return {
      message:
        user.accountStatus === "BANNED"
          ? "This account has been banned and can no longer log in."
          : "This account is currently suspended. Please contact an admin.",
    };
  }

  redirect(user.onboardingCompleted ? "/discover" : "/onboarding");
}

export async function logoutAction() {
  await logoutUser();
  revalidatePath("/", "layout");
  redirect("/");
}
