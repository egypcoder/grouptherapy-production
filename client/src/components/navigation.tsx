import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Radio, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useRadio } from "@/lib/radio-context";

const musicDropdownItems = [
  { href: "/releases", label: "Releases" },
  { href: "/artists", label: "Artists" },
  { href: "/playlists", label: "Playlists" },
  { href: "/radio", label: "Radio" },
];

const discoverDropdownItems = [
  { href: "/events", label: "Events" },
  { href: "/tours", label: "Tours" },
  { href: "/videos", label: "Videos" },
  { href: "/news", label: "News" },
];

const navLinks = [
  { href: "/", label: "Home" },
  { type: "dropdown", label: "Music", items: musicDropdownItems },
  { type: "dropdown", label: "Discover", items: discoverDropdownItems },
  { href: "/awards", label: "Awards" },
  { href: "/contact", label: "Contact" },
];

const mobileLinks = [
  { href: "/", label: "Home" },
  { href: "/releases", label: "Releases" },
  { href: "/artists", label: "Artists" },
  { href: "/playlists", label: "Playlists" },
  { href: "/radio", label: "Radio" },
  { href: "/events", label: "Events" },
  { href: "/tours", label: "Tours" },
  { href: "/videos", label: "Videos" },
  { href: "/news", label: "News" },
  { href: "/awards", label: "Awards" },
  { href: "/contact", label: "Contact" },
];

function NavDropdown({ 
  label, 
  items, 
  isActive 
}: { 
  label: string; 
  items: { href: string; label: string }[];
  isActive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const isCurrentActive = items.some(item => location === item.href);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          "relative px-4 py-2 text-sm font-medium transition-colors rounded-full flex items-center gap-1",
          isCurrentActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
        <ChevronDown className={cn(
          "h-3.5 w-3.5 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
        {isCurrentActive && (
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-full -z-10"
            layoutId="navActive"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 pt-2 z-50"
          >
            <div className="bg-popover/95 border border-border/50 rounded-xl shadow-lg shadow-black/10 overflow-hidden min-w-[160px]">
              <div className="p-1.5">
                {items.map((item, index) => (
                  <Link key={item.href} href={item.href}>
                    <motion.button
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "w-full text-left px-3.5 py-2 text-sm rounded-lg transition-colors",
                        location === item.href
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </motion.button>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
          <nav className="flex items-center justify-between h-14 lg:h-16">
            <Link href="/" className="flex items-center gap-1 group" data-testid="link-logo">
            <img src="/favicon.png" className="w-8 h-8" alt="GroupTherapy Records Logo" />
              <span className="text-lg lg:text-xl font-semibold tracking-tight">
                GROUP<span className="text-primary transition-colors">THERAPY</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => (
                link.type === "dropdown" ? (
                  <NavDropdown 
                    key={link.label} 
                    label={link.label} 
                    items={link.items!} 
                    isActive={false}
                  />
                ) : (
                  <Link key={link.href} href={link.href!}>
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
                )
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/radio" className="hidden sm:block">
                <Button
                  variant={isPlaying ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full gap-2 transition-all duration-300 h-8 text-xs",
                    isPlaying 
                      ? "shadow-md shadow-primary/20" 
                      : "border-border/50 hover:border-primary/30"
                  )}
                  data-testid="button-radio-cta"
                >
                  <Radio className="h-3 w-3" />
                  {isPlaying ? "Live" : "Listen"}
                </Button>
              </Link>

              <ThemeToggle className="h-11 w-11 sm:h-9 sm:w-9 rounded-full" />

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full h-11 w-11"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6 scale-150" /> : <Menu className="h-6 w-6 scale-150" />}
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
              <div className="flex flex-col items-center gap-1.5 mb-8">
                {mobileLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link href={link.href}>
                      <button
                        className={cn(
                          "text-2xl font-medium py-1.5 transition-colors",
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

              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
