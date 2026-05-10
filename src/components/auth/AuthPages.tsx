import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Eye,
  EyeOff,
  Calendar as CalIcon,
  ShieldAlert,
  X,
  Lock,
} from "lucide-react";
import { Button, Input, Modal, SuspensionModal } from "@/components/UI";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

import { UserRole } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

const readJsonSafely = async (response: Response) => {
  const rawBody = await response.text();
  if (!rawBody) {
    return { rawText: "" };
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return { rawText: rawBody };
  }
};

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
   const router = useRouter();
   const searchParams = useSearchParams();
   const redirectPath = searchParams?.get("redirect");

   const handleSuccessfulLogin = (user: any) => {
     if (redirectPath) {
       router.push(redirectPath);
       return;
     }

     const userRole = user.role?.toLowerCase();
    const organizerStatus = user.organizerStatus;
    const artisanStatus = user.artisanStatus;

    if (userRole === "organizer") {
      if (organizerStatus === "Not Submitted") {
        router.push("/dashboard/organizer/onboarding");
      } else if (organizerStatus === "Pending" || organizerStatus === "Under Review") {
        router.push("/organizer/waiting");
      } else if (organizerStatus === "Rejected" || organizerStatus === "Modification Requested") {
        router.push("/dashboard/organizer/onboarding");
      } else if (organizerStatus === "Approved") {
        router.push("/dashboard/organizer/overview");
      }
    } else if (userRole === "artisan") {
      if (artisanStatus === "Not Submitted") {
        router.push("/dashboard/artisan/onboarding");
      } else if (artisanStatus === "Pending" || artisanStatus === "Under Review") {
        router.push("/artisan/waiting");
      } else if (artisanStatus === "Approved") {
        router.push("/dashboard/artisan/overview");
      }
    } else if (userRole === "delivery") {
      const deliveryStatus = user.deliveryStatus;
      if (!deliveryStatus || deliveryStatus === "Not Submitted") {
        router.push("/dashboard/delivery/onboarding");
      } else if (
        deliveryStatus === "Pending" ||
        deliveryStatus === "Under Review"
      ) {
        router.push("/delivery/waiting");
      } else if (deliveryStatus === "Approved") {
        router.push("/dashboard/delivery");
      }
    } else {
      router.push(userRole === "admin" ? "/dashboard/admin/overview" : "/");
    }
  };

  const handleSuspensionModalClose = () => {
    setShowSuspensionModal(false);
    if (pendingUser) {
      handleSuccessfulLogin(pendingUser);
      setPendingUser(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({ email, password });

      if (res.success) {
        const userRole = res.user.role?.toLowerCase();
        const organizerStatus = res.user.organizerStatus;
        const artisanStatus = res.user.artisanStatus;

        if (userRole === "organizer") {
          if (organizerStatus === "Not Submitted") {
            router.push("/dashboard/organizer/onboarding");
          } else if (
            organizerStatus === "Pending" ||
            organizerStatus === "Under Review"
          ) {
            router.push("/organizer/waiting");
          } else if (
            organizerStatus === "Rejected" ||
            organizerStatus === "Modification Requested"
          ) {
            router.push("/dashboard/organizer/onboarding");
          } else if (organizerStatus === "Approved") {
            router.push("/dashboard/organizer/overview");
          }
        } else if (userRole === "artisan") {
          if (artisanStatus === "Not Submitted") {
            router.push("/dashboard/artisan/onboarding");
          } else if (
            artisanStatus === "Pending" ||
            artisanStatus === "Under Review"
          ) {
            router.push("/artisan/waiting");
          } else if (artisanStatus === "Approved") {
            router.push("/dashboard/artisan/overview");
          }
        } else if (userRole === "delivery") {
          const deliveryStatus = res.user.deliveryStatus;
          if (!deliveryStatus || deliveryStatus === "Not Submitted") {
            router.push("/dashboard/delivery/onboarding");
          } else if (
            deliveryStatus === "Pending" ||
            deliveryStatus === "Under Review"
          ) {
            router.push("/delivery/waiting");
          } else if (deliveryStatus === "Approved") {
            router.push("/dashboard/delivery");
          }
        } else {
          router.push(userRole === "admin" ? "/dashboard/admin/overview" : "/");
        }
        handleSuccessfulLogin(res.user);
      } else {
        setError(res.message || t("auth.loginFailed"));
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || t("auth.unexpectedError"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50/50">
      <div className="bg-white p-10 md:p-16 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] max-w-lg w-full border border-gray-100 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/5 rounded-[28px] flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-black text-primary mb-3 tracking-tight">
            {t("auth.loginTitle")}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
            {t("auth.loginSubtitle") || "Welcome back! Enter your credentials to access your account."}
          </p>
        </div>

        <SuspensionModal
          isOpen={showSuspensionModal}
          onClose={handleSuspensionModalClose}
          reason={pendingUser?.suspensionReason}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white focus:ring-0 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:bg-white focus:ring-0 outline-none transition-all text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 text-gray-600">
              <input type="checkbox" className="rounded text-primary focus:ring-primary" />
              <span>{t("auth.rememberMe")}</span>
            </label>
            <a href="/auth/forgot-password" className="text-primary font-semibold hover:underline">
              {t("auth.forgotPassword")}
            </a>
          </div>

          <Button type="submit" className="w-full py-8 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all">
            {t("auth.loginButton")}
          </Button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-50 text-center text-xs font-medium text-gray-400">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline ml-1">
            {t("auth.register")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.TOURIST);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDontMatch") || "Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = { name, email, password, role };

      const response = await fetch("/api/auth/register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJsonSafely(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.rawText ||
            `Failed to register (HTTP ${response.status}).`
        );
      }

      sessionStorage.setItem("pendingVerificationEmail", email);
      sessionStorage.setItem(
        "pendingRegistrationMeta",
        JSON.stringify({
          name,
          email,
          role: role.toLowerCase(),
        })
      );
      const query = new URLSearchParams({
        email,
        name,
        role: role.toLowerCase(),
      }).toString();
      router.push(`/register/verify?${query}`);
    } catch (err: any) {
      setError(err.message || t("auth.unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-20 bg-ethio-bg flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-2xl w-full border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-primary mb-2">
            {t("auth.registerTitle")}
          </h1>
          <p className="text-gray-500">{t("auth.registerSubtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { id: UserRole.TOURIST, titleKey: "tourist", descKey: "browseDesc", icon: MapPin },
            { id: UserRole.ARTISAN, titleKey: "artisan", descKey: "sellDesc", icon: Briefcase },
            { id: UserRole.ORGANIZER, titleKey: "organizer", descKey: "listDesc", icon: CalIcon },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id as UserRole)}
              className={`p-6 rounded-2xl text-left border-2 transition-all ${
                role === r.id
                  ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                  : "border-gray-100 hover:border-primary/50"
              }`}
            >
              <r.icon className={`w-8 h-8 mb-4 ${role === r.id ? "text-primary" : "text-gray-400"}`} />
              <h3 className="font-bold text-primary">{t(`auth.roles.${r.titleKey}`)}</h3>
              <p className="text-xs text-gray-500">{t(`auth.descriptions.${r.descKey}`)}</p>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleRegister}>
          <Input
            label={t("auth.fullName")}
            placeholder="Abebe Bikila"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label={t("auth.email")}
            type="email"
            placeholder="yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={t("auth.password")}
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label={t("auth.confirmPassword")}
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <div className="md:col-span-2 space-y-4 pt-4">
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              We&apos;ll send you updates about authentic cultural products and festivals.
            </p>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
