import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useRadio } from "@/lib/radio-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/releases", label: "Releases" },
  { href: "/artists", label: "Artists" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
  { href: "/news", label: "News" },
];

const secondaryLinks = [
  { href: "/playlists", label: "Playlists" },
  { href: "/videos", label: "Videos" },
  { href: "/contact", label: "Contact" },
];

export function Navigation() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isPlaying, isLive } = useRadio();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <nav className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 group" data-testid="link-logo">
              <span className="text-xl lg:text-2xl font-semibold tracking-tight">
                GROUP<span className="text-primary transition-colors">THERAPY</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <button
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
                      location === link.href
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-testid={`link-nav-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                    {location === link.href && (
                      <motion.div
                        className="absolute inset-0 bg-primary/10 rounded-full -z-10"
                        layoutId="navActive"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/radio" className="hidden sm:block">
                <Button
                  variant={isPlaying ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full gap-2 transition-all duration-300",
                    isPlaying 
                      ? "shadow-md shadow-primary/20" 
                      : "border-border/50 hover:border-primary/30"
                  )}
                  data-testid="button-radio-cta"
                >
                  <Radio className="h-3.5 w-3.5" />
                  {isPlaying ? "Live" : "Listen"}
                </Button>
              </Link>

              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </Button>
            </div>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 bg-background/95 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.nav
              className="absolute inset-0 flex flex-col items-center justify-center px-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex flex-col items-center gap-2 mb-8">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={link.href}>
                      <button
                        className={cn(
                          "text-3xl font-medium py-2 transition-colors",
                          location === link.href
                            ? "text-primary"
                            : "text-foreground/70 hover:text-foreground"
                        )}
                        data-testid={`link-mobile-${link.label.toLowerCase()}`}
                      >
                        {link.label}
                      </button>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-4 pt-8 border-t border-border/30">
                {secondaryLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Link href={link.href}>
                      <button
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </button>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/admin">
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    data-testid="link-mobile-admin"
                  >
                    Admin
                  </Button>
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
