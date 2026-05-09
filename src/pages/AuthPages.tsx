import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Eye,
  EyeOff,
  Calendar as CalIcon,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button, Input, Modal, SuspensionModal } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

import { UserRole } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useGoogleLogin } from "@react-oauth/google";

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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{ email: string; name: string } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        setGoogleLoading(true);
        const credential = (tokenResponse as any).credential;
        if (!credential) {
          throw new Error('No credential received');
        }
        const decoded = JSON.parse(atob(credential.split('.')[1]));
        const googleUser = {
          googleId: decoded.sub,
          email: decoded.email,
          name: decoded.name,
        };

        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(googleUser),
        });
        const data = await res.json();

        if (data.needsRole) {
          setPendingGoogleUser({ email: data.email, name: data.name });
          setShowRoleModal(true);
        } else if (data.success) {
          handleSuccessfulLogin(data.user);
        } else {
          showNotification(data.message || 'Google login failed', 'error');
        }
      } catch (error: any) {
        console.error('Google login error:', error);
        showNotification(error.message || 'Google login failed', 'error');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      console.error('Google login failed');
      showNotification('Google login failed. Please try again.', 'error');
    },
  });

  const handleGoogleRegister = async (selectedRole: UserRole) => {
    if (!pendingGoogleUser) return;
    
    try {
      setGoogleLoading(true);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: '',
          email: pendingGoogleUser.email,
          name: pendingGoogleUser.name,
          role: selectedRole.toLowerCase(),
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setShowRoleModal(false);
        handleSuccessfulLogin(data.user);
      } else {
        showNotification(data.message || 'Registration failed', 'error');
      }
    } catch (error: any) {
      console.error('Google register error:', error);
      showNotification(error.message || 'Registration failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSuccessfulLogin = (user: any) => {
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
        showNotification(res.message || t("auth.loginFailed"), 'error');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      showNotification(error.message || t("auth.unexpectedError"), 'error');
    }
  };

  return (
    <>
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-ethio-bg">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">
              {t("auth.loginTitle")}
            </h1>
            <p className="text-gray-500">{t("auth.loginSubtitle")}</p>
          </div>

          <SuspensionModal
            isOpen={showSuspensionModal}
            onClose={handleSuspensionModalClose}
            reason={pendingUser?.suspensionReason}
          />

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label={t("auth.email")}
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label={t("auth.password")}
                type={showPassword ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-primary"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
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

            <Button type="submit" className="w-full" size="lg">
              {t("auth.loginButton")}
            </Button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-3"
            onClick={() => googleLogin()}
            disabled={googleLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.96 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.96 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{googleLoading ? "Processing..." : "Sign in with Google"}</span>
          </Button>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              {t("auth.register")}
            </Link>
          </div>
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full mx-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif font-bold text-primary mb-2">
                Choose Your Role
              </h2>
              <p className="text-gray-500">
                Welcome! Please select how you want to use Ethio Craft Hub
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {[
                { id: UserRole.TOURIST, titleKey: "tourist", descKey: "browseDesc", icon: MapPin },
                { id: UserRole.ARTISAN, titleKey: "artisan", descKey: "sellDesc", icon: Briefcase },
                { id: UserRole.ORGANIZER, titleKey: "organizer", descKey: "listDesc", icon: CalIcon },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleGoogleRegister(r.id as UserRole)}
                  className="p-6 rounded-2xl text-left border-2 transition-all hover:border-primary bg-ethio-bg"
                  disabled={googleLoading}
                >
                  <r.icon className="w-8 h-8 mb-4 text-secondary" />
                  <h3 className="font-bold text-primary">{t(`auth.roles.${r.titleKey}`)}</h3>
                  <p className="text-xs text-gray-500">{t(`auth.descriptions.${r.descKey}`)}</p>
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowRoleModal(false);
                setPendingGoogleUser(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
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
  const { showNotification } = useNotification();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showNotification(t("auth.passwordsDontMatch"), 'error');
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
    } catch (error: any) {
      showNotification(error.message || t("auth.unexpectedError"), 'error');
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
