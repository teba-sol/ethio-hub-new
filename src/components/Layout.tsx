"use client";
import React, { useState } from "react";
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
  Truck
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
    <div className="fixed inset-0 z-[60] flex justify-end pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-secondary" />
            {checkoutStep === "cart"
              ? "Your Cart"
              : "Order Confirmed"}
          </h2>
          <div className="flex items-center gap-3">
            {checkoutStep === "cart" && cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={toggleCart}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {checkoutStep === "cart" && (
            <>
               {cart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                     <ShoppingCart className="w-8 h-8 text-gray-400" />
                   </div>
                   <p className="text-gray-500 font-medium">
                     {t("cart.emptyCart")}
                   </p>
                   <Button variant="outline" onClick={toggleCart}>
                     {t("cart.continueShopping")}
                   </Button>
                 </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-primary text-sm line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">
                          {item.category}
                        </p>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="font-bold text-primary">
                          ${item.price * item.quantity}
                        </p>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-xs font-bold hover:text-secondary transition-colors"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-xs font-bold hover:text-secondary transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {checkoutStep === "success" && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {t("cart.orderConfirmed")}
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  {t("cart.orderConfirmedMsg")}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl w-full max-w-xs">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                  {t("cart.transactionId")}
                </p>
                <p className="font-mono font-bold text-primary">
                  TXN-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 &&
          checkoutStep !== "success" &&
          (
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t("cart.subtotal")}</span>
                    <span>${cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{t("cart.shipping")}</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t border-gray-200">
                    <span>{t("cart.total")}</span>
                    <span>${cartTotal}</span>
                  </div>
                </div>

              {checkoutStep === "cart" ? (
                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/10 group"
                  rightIcon={ArrowRight}
                >
                  Proceed to Checkout
                </Button>
              ) : null}

              <p className="text-[9px] text-center text-gray-400 font-medium">
                Secure checkout powered by Chapa
              </p>
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

const UserMenu: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const getDashboardHomePath = () => {
    if (!user) return "/login";
    const role = user.role.toLowerCase();
    const dashboardHomeByRole: Record<string, string> = {
      tourist: "/dashboard/tourist/settings",
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
    <div className="relative group z-50 mr-4">
      <Link
        href={isAuthenticated ? getDashboardHomePath() : "/login"}
        className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-full transition-all"
      >
        <UserIcon className="w-6 h-6 text-gray-700" />
        <div className="flex flex-col text-xs leading-tight">
          <span className="text-gray-500 font-medium">{t("header.welcome")}</span>
          <span className="font-bold text-gray-900">
            {isAuthenticated ? user?.name?.split(" ")[0] : t("header.signInRegister")}
          </span>
        </div>
      </Link>

      <div className="absolute top-full right-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden p-2">
          {!isAuthenticated ? (
            <div className="p-4 text-center bg-gray-50/50 rounded-xl mb-2">
              <Button
                className="w-full rounded-full font-bold mb-3 shadow-lg shadow-primary/20"
                onClick={() => router.push("/login")}
              >
                {t("auth.signIn")}
              </Button>
              <div className="text-xs text-gray-500">
                {t("header.newHere")}{" "}
                <Link
                  href="/register"
                  className="text-primary font-bold hover:underline"
                >
                  {t("auth.register")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center bg-gray-50/50 rounded-xl mb-2">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                {user?.name?.charAt(0)}
              </div>
              <p className="font-bold text-gray-900 mb-3 line-clamp-1">
                {user?.name}
              </p>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={logout}
                 className="rounded-full w-full border-gray-200"
               >
                 {t("header.signOut")}
               </Button>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="space-y-0.5">
              <MenuLink
                icon={FileText}
                label={t("header.myOrders")}
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
            <div className="h-px bg-gray-100 my-2 mx-2" />
            <div className="space-y-0.5">
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
              <MenuLink
                icon={AlertCircle}
                label={t("header.disputes")}
                to={getDashboardPath("disputes")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log("Searching for:", query);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative hidden md:block mx-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          className="pl-4 pr-10 py-2.5 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-sm w-64 transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

const ThemeToggle = () => {
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
      className="p-2 text-gray-400 hover:text-primary transition-colors relative ml-2 group"
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
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { name: t("nav.heritage"), path: "/" },
    { name: t("nav.products"), path: "/products" },
    { name: t("nav.festivals"), path: "/festivals" },
    { name: t("nav.about"), path: "/about" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-50">
      <CartDrawer />
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold font-serif text-primary tracking-tight">
              Ethio<span className="text-secondary">-Craft</span> Hub
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-secondary ${
                  isActive(link.path)
                    ? "text-primary border-b-2 border-secondary pb-1"
                    : "text-gray-400"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center">
            <SearchBar />

            <LanguageToggle />
            <ThemeToggle />

            <button
              onClick={toggleCart}
              className="p-2 text-gray-400 hover:text-primary transition-colors relative ml-2 mr-4 group"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 group-hover:text-primary transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-accent text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white shadow-sm animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </div>
            </button>

            <UserMenu />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-primary ml-2"
              aria-label="Toggle Menu"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-in fade-in slide-in-from-top duration-300">
          <div className="px-4 pt-4 pb-12 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-5 text-sm font-bold uppercase tracking-widest rounded-2xl ${
                  isActive(link.path)
                    ? "bg-ethio-bg text-primary"
                    : "text-gray-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-6 grid grid-cols-2 gap-4 px-2">
              {!isAuthenticated ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl py-4"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/login");
                    }}
                  >
                    {t("auth.signIn")}
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full rounded-2xl py-4"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/register");
                    }}
                  >
                    {t("auth.register")}
                  </Button>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="col-span-2"
                >
                  <Button className="w-full rounded-2xl py-4">
                    {t("nav.dashboard")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
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
