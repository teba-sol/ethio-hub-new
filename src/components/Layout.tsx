"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Search,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  FileText,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Settings,
  HelpCircle,
  AlertCircle,
  Ticket,
  Briefcase,
  RotateCcw,
  Coins,
  Heart,
  Check,
  Moon,
  Sun,
  FileQuestion,
  Truck,
  Lock,
  MapPin,
  Calendar
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage, LanguageProvider } from "../context/LanguageContext";
import { UserRole } from "../types";
import { Button } from "./UI";
import LanguageToggle from "./LanguageToggle";

const CartDrawer: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    isCartOpen,
    toggleCart,
    clearCart,
  } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [checkoutStep, setCheckoutStep] = useState<
    "cart" | "success"
  >("cart");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleProceedToCheckout = async () => {
    if (!isAuthenticated || user?.role !== UserRole.TOURIST) {
      setShowLoginPrompt(true);
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      const idempotencyKey = crypto.randomUUID();

      const response = await fetch("/api/chapa/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          idempotencyKey,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        console.error("Payment initialization failed:", data.message);
        alert(data.message || "Failed to initialize payment");
        setCheckoutStep("cart");
      }
    } catch (error) {
      console.error("Error in cart checkout:", error);
      alert("An error occurred. Please try again.");
      setCheckoutStep("cart");
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none flex justify-end p-4 md:p-6 lg:pt-28">
      {/* Backdrop - Only covers area below header if desired, but inset-0 is safer for focus */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto animate-in fade-in duration-300" 
        onClick={toggleCart}
      />
      
      <div className="relative pointer-events-auto w-full max-w-md bg-white h-fit max-h-[calc(100vh-120px)] shadow-[0_20px_80px_rgba(0,0,0,0.3)] flex flex-col animate-in slide-in-from-right-10 duration-500 ease-out border border-gray-100 rounded-[40px] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-serif font-black text-primary flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-primary/5 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-secondary" />
              </div>
              {checkoutStep === "cart" ? "Shopping Bag" : "Order Confirmed"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-black rounded-md uppercase tracking-wider">
                {cart.length} {cart.length === 1 ? 'ITEM' : 'ITEMS'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {checkoutStep === "cart" && cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-all p-2 hover:bg-red-50 rounded-lg"
              >
                Reset
              </button>
            )}
            <button
              onClick={toggleCart}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group border border-gray-100"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          {checkoutStep === "cart" && (
            <>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center animate-pulse">
                      <ShoppingCart className="w-10 h-10 text-gray-200" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center border border-gray-50">
                      <Search className="w-5 h-5 text-secondary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-2">Your bag is empty</h3>
                    <p className="text-gray-400 text-sm max-w-[200px] mx-auto leading-relaxed">
                      Looks like you haven't added any cultural treasures yet.
                    </p>
                  </div>
                  <Button variant="outline" onClick={toggleCart} className="rounded-xl border-gray-200">
                    {t("cart.continueShopping")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative bg-gray-50/30 hover:bg-white hover:shadow-xl hover:shadow-black/5 rounded-3xl p-4 border border-transparent hover:border-gray-100 transition-all duration-500"
                    >
                      <div className="flex gap-4">
                        {/* Item Image */}
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white flex-shrink-0 border border-gray-100 shadow-sm">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                {item.artisanName && (
                                  <p className="text-[8px] font-black text-secondary uppercase tracking-[0.2em] mb-1">
                                    {item.artisanName} Store
                                  </p>
                                )}
                                <h4 className="font-bold text-primary text-sm leading-tight line-clamp-2 group-hover:text-secondary transition-colors">
                                  {item.name}
                                </h4>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {item.category}
                              </span>
                              {item.sku && (
                                <>
                                  <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                  <span className="text-[10px] text-gray-300 font-medium">SKU: {item.sku}</span>
                                </>
                              )}
                              <div className="w-1 h-1 bg-gray-200 rounded-full" />
                              <span className="text-[10px] text-secondary font-black uppercase">
                                {item.price.toLocaleString()} ETB / unit
                              </span>
                            </div>
                            {item.estimatedDelivery && (
                              <p className="text-[9px] text-emerald-600 font-bold mt-2 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                                <Truck className="w-3 h-3" />
                                Est. Delivery: {item.estimatedDelivery}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-end mt-4">
                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                              <button
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-7 h-7 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-all"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black w-6 text-center text-primary tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Item Total</p>
                              <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-lg font-black text-primary tracking-tight">
                                  {(item.price * item.quantity).toLocaleString()}
                                </span>
                                <span className="text-[9px] text-gray-400 font-black uppercase">ETB</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {checkoutStep === "success" && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-green-100 border border-green-100">
                <Check className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black text-primary">
                  Order Received!
                </h3>
                <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                  Your journey into Ethiopian craftsmanship has begun. We're preparing your treasures.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-6 rounded-[32px] w-full space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-black">
                    Transaction Hash
                  </p>
                  <p className="font-mono font-bold text-primary text-sm break-all bg-white p-3 rounded-2xl border border-gray-100">
                    ETH-{Math.random().toString(36).substr(2, 12).toUpperCase()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-left">
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Status</p>
                    <div className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Processing
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Delivery</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">3-5 Days</p>
                  </div>
                </div>
              </div>
              <Button onClick={toggleCart} className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs">
                Back to Explorer
              </Button>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && checkoutStep !== "success" && (
          <div className="p-8 border-t border-gray-100 bg-white/80 backdrop-blur-xl shadow-[0_-20px_40px_rgba(0,0,0,0.03)] space-y-6">

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Payable</p>
                    <p className="text-[9px] text-gray-400 font-medium">Including all local taxes & duties</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1.5 justify-end">
                      <span className="text-4xl font-black text-primary tracking-tighter tabular-nums leading-none">
                        {cartTotal.toLocaleString()}
                      </span>
                      <span className="text-xs font-black text-secondary uppercase tracking-widest">ETB</span>
                    </div>
                  </div>
                </div>

            <div className="space-y-4">
              {checkoutStep === "cart" && (
                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full py-8 rounded-[24px] font-black uppercase tracking-[0.25em] text-[13px] shadow-[0_20px_40px_rgba(15,76,58,0.25)] bg-primary hover:bg-secondary hover:shadow-secondary/30 transition-all duration-500 border-none group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                </Button>
              )}
              
              <div className="flex items-center justify-center gap-6 py-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.15em]">Verified Secure</span>
                </div>
                <div className="w-px h-3 bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.15em]">Multiple Gateways</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300 relative text-center">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-amber-600" />
              </div>

              <h3 className="text-xl font-serif font-bold text-primary mb-2">
                {t("header.loginRequired")}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {t("header.loginDesc")}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  {t("header.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    toggleCart();
                    router.push("/login");
                  }}
                >
                  {t("header.loginNow")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MenuLink = ({ icon: Icon, label, to }: any) => (
  <Link
    href={to || "#"}
    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors group/item"
  >
    <Icon className="w-4 h-4 text-gray-400 group-hover/item:text-primary transition-colors" />
    <span className="font-medium">{label}</span>
  </Link>
);

const UserMenu: React.FC<{ isScrolled: boolean, isHomePage: boolean }> = ({ isScrolled, isHomePage }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const getDashboardHomePath = () => {
    if (!user) return "/login";
    const role = user.role.toLowerCase();
    const dashboardHomeByRole: Record<string, string> = {
      tourist: "/dashboard/tourist/bookings",
      organizer: "/dashboard/organizer/overview",
      artisan: "/dashboard/artisan/overview",
      admin: "/dashboard/admin/overview",
      delivery: "/dashboard/delivery",
    };
    return dashboardHomeByRole[role] || "/dashboard";
  };

  const getDashboardPath = (path: string) => {
    if (!user) return "#";
    const role = user.role.toLowerCase();
    return `/dashboard/${role}/${path}`;
  };

  return (
    <div className="relative group z-50">
      {isAuthenticated ? (
        <Link
          href={getDashboardHomePath()}
          className={`flex items-center gap-3 p-1 pr-4 rounded-full border transition-all duration-500 group/nav ${
            isScrolled || !isHomePage
              ? "border-white/10 bg-white/10 hover:bg-white/20 hover:shadow-xl"
              : "border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:shadow-2xl hover:shadow-black/20"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform overflow-hidden">
            {user?.touristProfile?.profileImage ? (
              <img src={user.touristProfile.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div className="hidden lg:block text-left">
            <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${
              isScrolled || !isHomePage ? "text-white" : "text-white"
            }`}>
              {user?.role}
            </p>
            <span className={`text-xs font-bold ${
              isScrolled || !isHomePage ? "text-white" : "text-white"
            }`}>
              {user?.name?.split(" ")[0]}
            </span>
          </div>
        </Link>
      ) : (
        <Link
          href="/login"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
            isScrolled || !isHomePage
              ? "bg-secondary text-primary hover:bg-white hover:text-primary hover:shadow-lg"
              : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:shadow-xl hover:shadow-white/20"
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          {t("auth.signIn")}
        </Link>
      )}

      <div className="absolute top-full right-0 pt-3 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
        <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden">
          {!isAuthenticated ? (
            <div className="p-6 text-center bg-gradient-to-br from-gray-50 to-white">
              <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-serif font-bold text-primary mb-2">Join Ethio-Craft Hub</h4>
              <p className="text-xs text-gray-400 mb-6">Discover the soul of Ethiopian craftsmanship and heritage.</p>
              <Button
                className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] mb-4 shadow-lg shadow-primary/20 h-12"
                onClick={() => router.push("/login")}
              >
                {t("auth.signIn")}
              </Button>
              <p className="text-[10px] font-bold text-gray-400">
                {t("header.newHere")}{" "}
                <Link
                  href="/register"
                  className="text-secondary hover:underline"
                >
                  {t("auth.register")}
                </Link>
              </p>
            </div>
          ) : (
            <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm font-black text-xl">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-primary truncate leading-tight">{user?.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{user?.role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={logout}
                  className="rounded-xl w-full border-gray-200 h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                >
                  {t("header.signOut")}
                </Button>
                {pathname === '/' && (
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/login')}
                    className="w-full text-[9px] font-black uppercase text-gray-400 hover:text-primary"
                  >
                    Sign in as different user
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
            <div className="px-3 py-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Navigation</p>
              <MenuLink
                icon={Briefcase}
                label="Dashboard Overview"
                to={getDashboardHomePath()}
              />
              <MenuLink
                icon={FileText}
                label={user?.role === UserRole.TOURIST ? t("header.myOrder") : t("header.myOrders")}
                to={getDashboardPath("orders")}
              />
              <MenuLink
                icon={Truck}
                label={t("header.orderTracking")}
                to={getDashboardPath("order-tracking")}
              />
              <MenuLink
                icon={CreditCard}
                label={t("header.payments")}
                to={getDashboardPath("payments")}
              />
              <MenuLink
                icon={Heart}
                label={t("header.wishlist")}
                to={getDashboardPath("wishlist")}
              />
            </div>

            <div className="h-px bg-gray-50 mx-4" />

            <div className="px-3 py-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Settings & Support</p>
              <MenuLink
                icon={Settings}
                label={t("header.settings")}
                to={getDashboardPath("settings")}
              />
              <MenuLink
                icon={HelpCircle}
                label={t("header.helpCenter")}
                to={getDashboardPath("help")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({ isScrolled, isHomePage }: { isScrolled: boolean, isHomePage: boolean }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ products: any[], festivals: any[] }>({ products: [], festivals: [] });
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ products: [], festivals: [] });
      setShowResults(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const [productsRes, festivalsRes] = await Promise.all([
          fetch(`/api/public/products?search=${encodeURIComponent(query.trim())}&limit=4`),
          fetch(`/api/festivals?search=${encodeURIComponent(query.trim())}&limit=4`)
        ]);
        const [productsData, festivalsData] = await Promise.all([
          productsRes.json(),
          festivalsRes.json()
        ]);
        setResults({
          products: (productsData.products || []).slice(0, 4),
          festivals: (festivalsData.festivals || []).slice(0, 4)
        });
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };

  const hasResults = results.products.length > 0 || results.festivals.length > 0;

  return (
    <div ref={searchRef} className="relative hidden md:block mx-4">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            placeholder={t("header.searchPlaceholder") || "Search products or events..."}
            className={`pl-4 pr-10 py-2.5 rounded-full border outline-none text-xs w-64 transition-all duration-500 ${
              isScrolled || !isHomePage
                ? "bg-white/10 dark:bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/5"
                : "bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white focus:ring-4 focus:ring-white/10"
            }`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            {isSearching ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
                <Search className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 w-[400px] right-0 bg-white dark:bg-ethio-dark rounded-3xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden z-50"
          >
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-4 space-y-6">
              {/* Products Section */}
              {results.products.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Products</h4>
                    <Link href={`/products?search=${query}`} className="text-[10px] font-bold text-secondary hover:underline">View All</Link>
                  </div>
                  <div className="space-y-1">
                    {results.products.map((product) => (
                      <Link 
                        key={product._id} 
                        href={`/products/${product._id}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <img src={product.images?.[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-primary dark:text-white truncate">{product.name}</p>
                          <p className="text-[10px] text-secondary font-black">{product.price} ETB</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Festivals Section */}
              {results.festivals.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Festivals & Events</h4>
                    <Link href={`/festivals?search=${query}`} className="text-[10px] font-bold text-secondary hover:underline">View All</Link>
                  </div>
                  <div className="space-y-1">
                    {results.festivals.map((festival) => (
                      <Link 
                        key={festival._id} 
                        href={`/event/${festival._id}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <img src={festival.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-primary dark:text-white truncate">{festival.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                                <MapPin className="w-2.5 h-2.5" />
                                {festival.region}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!isSearching && !hasResults && query.length >= 2 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400 font-medium">No results found for "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ThemeToggle = ({ isScrolled, isHomePage }: { isScrolled: boolean, isHomePage: boolean }) => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const isDarkMode = localStorage.getItem("theme") === "dark" || document.documentElement.classList.contains("dark");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 transition-colors relative ml-2 group rounded-full ${
        isScrolled || !isHomePage 
          ? "text-white/80 hover:bg-white/10 hover:text-white" 
          : "text-white/80 hover:text-white hover:bg-white/10"
      }`}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 group-hover:text-primary transition-colors" />
      ) : (
        <Moon className="w-5 h-5 group-hover:text-primary transition-colors" />
      )}
    </button>
  );
};

export const Header: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.products"), path: "/products" },
    { name: t("nav.festivals"), path: "/festivals" },
    { name: t("nav.about"), path: "/about" },
  ];

  const isActive = (path: string) => pathname === path;

  const isHomePage = pathname === "/";

  return (
    <>
      <CartDrawer />
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || !isHomePage
          ? "bg-black/70 dark:bg-ethio-dark/80 backdrop-blur-md shadow-2xl py-4 border-b border-white/10" 
          : "bg-transparent py-6"
      }`}>
      <nav className="max-w-[1600px] mx-auto px-6 sm:px-12 lg:px-20">
        <div className="flex justify-between items-center h-12">
          <Link href="/" className="flex items-center gap-4 group shrink-0">
            <div className={`relative h-12 w-12 rounded-2xl overflow-hidden flex items-center justify-center border-2 transition-all duration-500 rotate-0 group-hover:rotate-6 ${
              isScrolled || !isHomePage ? "border-white/30 shadow-xl" : "border-white shadow-xl"
            }`}>
              <img 
                src="/uploads/avatars/logo.png" 
                alt="Ethio Craft Hub" 
                className="w-full h-full object-cover"
              />
            </div>

          </Link>

          {/* Desktop Nav - Centered */}
          <div className={`hidden lg:flex items-center gap-2 p-1 rounded-2xl transition-all duration-500 ${
            isScrolled || !isHomePage
              ? "bg-white/10 border border-white/10" 
              : ""
          } mx-8`}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300 ${
                  isActive(link.path)
                    ? "text-secondary scale-[1.05]"
                    : isScrolled || !isHomePage
                      ? "text-white/70 hover:text-white hover:bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions - Right Aligned */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2">
              <SearchBar isScrolled={isScrolled} isHomePage={isHomePage} />
              
              <div className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-500 rounded-2xl ${
                isScrolled 
                  ? "bg-white/10 border border-white/10" 
                  : ""
              }`}>
                <LanguageToggle isScrolled={isScrolled} isHomePage={isHomePage} />
                <ThemeToggle isScrolled={isScrolled} isHomePage={isHomePage} />
              </div>

              <button
                onClick={toggleCart}
                className={`w-11 h-11 flex items-center justify-center transition-all relative group rounded-2xl border ${
                  isScrolled || !isHomePage 
                    ? "text-white border-white/10 hover:bg-white/10" 
                    : "text-white border-white/20 hover:bg-white/10"
                }`}
                aria-label="Shopping Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-3 -right-3 h-5 w-5 bg-secondary text-primary text-[9px] flex items-center justify-center rounded-lg font-black shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </div>
              </button>

              <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2" />
              <UserMenu isScrolled={isScrolled} isHomePage={isHomePage} />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleCart}
              className="p-2 text-gray-400 relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent text-white text-[8px] flex items-center justify-center rounded-full font-black">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black/90 dark:bg-ethio-dark/95 backdrop-blur-xl border-t border-white/10 shadow-2xl md:hidden overflow-hidden rounded-b-[32px]"
          >
            <div className="px-6 pt-8 pb-12 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 mb-2">Discovery</p>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all ${isActive(link.path)
                        ? "bg-secondary text-primary shadow-lg shadow-secondary/20"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <span className="text-sm font-black uppercase tracking-widest">{link.name}</span>
                    <ArrowRight className={`w-4 h-4 ${isActive(link.path) ? "opacity-100" : "opacity-0"}`} />
                  </Link>
                ))}
              </div>

              <div className="pt-8 grid grid-cols-2 gap-4">
                {!isAuthenticated ? (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-2xl h-14 text-[10px] font-black uppercase tracking-widest"
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/login");
                      }}
                    >
                      {t("auth.signIn")}
                    </Button>
                    <Button
                      className="rounded-2xl h-14 text-[10px] font-black uppercase tracking-widest"
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/register");
                      }}
                    >
                      {t("auth.register")}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="col-span-2 rounded-2xl h-14 text-[10px] font-black uppercase tracking-widest"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/dashboard");
                    }}
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>

              <div className="pt-6 flex justify-center gap-6 border-t border-gray-50 mt-4 pt-8">
                <LanguageToggle isScrolled={isScrolled} isHomePage={isHomePage} />
                <ThemeToggle isScrolled={isScrolled} isHomePage={isHomePage} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
};

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-ethio-dark text-white pt-12 md:pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-16 mb-20">
          <div className="space-y-8">
            <span className="text-3xl font-bold font-serif text-secondary tracking-tight">
              Ethio<span className="text-white">-Craft</span> Hub
            </span>
            <p className="text-gray-400 text-lg leading-relaxed font-light">
              {t("footer.tagline")}
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-3 bg-white/5 rounded-2xl hover:bg-secondary/20 transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-3 bg-white/5 rounded-2xl hover:bg-secondary/20 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-3 bg-white/5 rounded-2xl hover:bg-secondary/20 transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-xl font-bold mb-8 text-secondary">
              {t("footer.heritageExplorer")}
            </h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li>
                <Link
                  href="/products"
                  className="hover:text-white transition-colors"
                >
                  {t("footer.curatedMarketplace")}
                </Link>
              </li>
              <li>
                <Link
                  href="/festivals"
                  className="hover:text-white transition-colors"
                >
                  {t("footer.sacredCelebrations")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t("footer.artisanStories")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t("footer.regionalGuides")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-xl font-bold mb-8 text-secondary">
              {t("footer.supportTrust")}
            </h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.helpCenter")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.authenticityShield")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.shippingReturns")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("footer.contactOffice")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-xl font-bold mb-8 text-secondary">
              {t("footer.hubDispatch")}
            </h4>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {t("footer.newsletterText")}
            </p>
            <div className="flex flex-col space-y-3">
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl focus:outline-none focus:border-secondary transition-all text-sm"
              />
              <Button
                size="md"
                variant="secondary"
                className="rounded-2xl py-4 font-bold shadow-xl shadow-secondary/10"
              >
                {t("footer.subscribe")}
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 gap-8">
          <p>{t("footer.copyright")}</p>
          <div className="flex space-x-8">
            <a href="#" className="hover:text-white transition-colors">
              {t("footer.privacy")}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {t("footer.terms")}
            </a>
            <div className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>{t("footer.international")} / EN</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
