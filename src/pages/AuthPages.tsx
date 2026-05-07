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
} from "lucide-react";
import { Button, Input } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { useLanguage } from "../context/LanguageContext";

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
  const [role, setRole] = useState<UserRole>(UserRole.TOURIST);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

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
       } else {
         alert(res.message || t("auth.loginFailed"));
       }
     } catch (error: any) {
       console.error("Login error:", error);
       alert(error.message || t("auth.unexpectedError"));
     }
  };

   return (
     <div className="min-h-[80vh] flex items-center justify-center p-4 bg-ethio-bg">
       <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
         <div className="text-center mb-10">
           <h1 className="text-3xl font-serif font-bold text-primary mb-2">
             {t("auth.loginTitle")}
           </h1>
           <p className="text-gray-500">{t("auth.loginSubtitle")}</p>
         </div>

         <form onSubmit={handleLogin} className="space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
               {t("auth.loginAs")}
             </label>
             <div className="grid grid-cols-2 gap-2 p-1 bg-ethio-light rounded-xl">
               {(Object.values(UserRole) as UserRole[]).map((r) => (
                 <button
                   key={r}
                   type="button"
                   onClick={() => setRole(r)}
                   className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${
                     role === r
                       ? "bg-primary text-white shadow-md"
                       : "text-gray-500 hover:bg-gray-200"
                   }`}
                 >
                   {r === UserRole.ADMIN && <ShieldAlert className="w-3 h-3 mr-1" />}
                   {t(`auth.roles.${r.toLowerCase()}`)}
                 </button>
               ))}
             </div>
           </div>

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

         <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
           {t("auth.noAccount")}{" "}
           <Link href="/register" className="text-primary font-bold hover:underline">
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
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert(t("auth.passwordsDontMatch"));
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
      alert(error.message || t("auth.unexpectedError"));
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
           <div className="md:col-span-2">
             <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
               {isSubmitting ? "..." : t("auth.continueButton")}
             </Button>
           </div>
<div className="md:col-span-2 space-y-4 pt-4">
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              We&apos;ll send you updates about authentic cultural products and festivals.
            </p>
            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
              Create account
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
