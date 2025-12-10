import { useState } from "react";
import { Link } from "wouter";
import { SiSpotify, SiInstagram, SiX, SiYoutube, SiSoundcloud } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/database";
import { Loader2, ArrowRight } from "lucide-react";

const footerLinks = {
  music: [
    { label: "Releases", href: "/releases" },
    { label: "Artists", href: "/artists" },
    { label: "Playlists", href: "/playlists" },
    { label: "Radio", href: "/radio" },
  ],
  discover: [
    { label: "Events", href: "/events" },
    { label: "Tours", href: "/tours" },
    { label: "Videos", href: "/videos" },
    { label: "News", href: "/news" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Press", href: "/press" },
    { label: "Careers", href: "/careers" },
  ],
};

const socialLinks = [
  { icon: SiSpotify, href: "#", label: "Spotify" },
  { icon: SiInstagram, href: "#", label: "Instagram" },
  { icon: SiX, href: "#", label: "X" },
  { icon: SiYoutube, href: "#", label: "YouTube" },
  { icon: SiSoundcloud, href: "#", label: "SoundCloud" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await db.newsletterSubscribers.subscribe(email, undefined, 'footer');
      toast({
        title: "Subscribed",
        description: "You're now part of the community.",
      });
      setEmail("");
    } catch (error: any) {
      if (error?.message?.includes("already subscribed") || error?.message?.includes("duplicate") || error?.code === "23505") {
        toast({
          title: "Already subscribed",
          description: "This email is already on our list.",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <footer className="bg-card border-t border-border/50 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-6" data-testid="link-footer-logo">
              <span className="text-xl font-semibold tracking-tight">
                GROUP<span className="text-primary">THERAPY</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
              The future of electronic music, curated for you. Join us on the journey.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <p className="text-sm font-medium">Stay updated</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="max-w-[220px] rounded-full bg-background border-border/50 focus:border-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-newsletter-email"
                />
                <Button 
                  size="icon" 
                  type="submit" 
                  disabled={isLoading} 
                  className="rounded-full shrink-0"
                  data-testid="button-newsletter-submit"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-medium mb-4 text-sm">Music</h4>
            <ul className="space-y-3">
              {footerLinks.music.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-medium mb-4 text-sm">Discover</h4>
            <ul className="space-y-3">
              {footerLinks.discover.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-medium mb-4 text-sm">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-medium mb-4 text-sm">Social</h4>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} GroupTherapy Records. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Privacy
              </span>
            </Link>
            <Link href="/terms">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Terms
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
