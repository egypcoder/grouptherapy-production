import { useMemo, useState } from "react";
import { Link } from "wouter";
import { SiSpotify, SiInstagram, SiX, SiYoutube, SiSoundcloud, SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/database";
import { Loader2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
    { label: "Promote Your Release", href: "/promote-your-release" },
    { label: "Promote Your Event", href: "/promote-your-event" },
    { label: "Awards", href: "/awards" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
};

export function Footer() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: siteSettings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const socialLinks = useMemo(() => {
    const links = siteSettings?.socialLinks;
    return [
      { icon: SiSpotify, href: links?.spotify, label: "Spotify" },
      { icon: SiInstagram, href: links?.instagram, label: "Instagram" },
      { icon: SiX, href: links?.x, label: "X" },
      { icon: SiYoutube, href: links?.youtube, label: "YouTube" },
      { icon: SiSoundcloud, href: links?.soundcloud, label: "SoundCloud" },
      { icon: SiTiktok, href: links?.tiktok, label: "TikTok" },
    ].filter((item) => !!item.href);
  }, [siteSettings?.socialLinks]);

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
    <footer className="bg-card border-t border-border/50 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-6">
          <div className="lg:col-span-4">
              <Link href="/" className="flex items-center gap-1 group mb-2" data-testid="link-logo">
            <img src="favicon.png" className="w-8 h-8" alt="GroupTherapy Records Logo" />
              <span className="text-lg lg:text-xl font-semibold tracking-tight">
                GROUP<span className="text-primary transition-colors">THERAPY</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm leading-relaxed">
              Home of Artists
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <p className="text-xs font-medium">Stay updated</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="max-w-[200px] rounded-full bg-background border-border/50 focus:border-primary/50 h-8 text-xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-newsletter-email"
                />
                <Button 
                  size="icon" 
                  type="submit" 
                  disabled={isLoading} 
                  className="rounded-full shrink-0 h-8 w-8"
                  data-testid="button-newsletter-submit"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-medium mb-3 text-xs">Music</h4>
            <ul className="space-y-2">
              {footerLinks.music.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-medium mb-3 text-xs">Discover</h4>
            <ul className="space-y-2">
              {footerLinks.discover.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-medium mb-3 text-xs">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-medium mb-3 text-xs">Social</h4>
            <div className="flex flex-wrap gap-1.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">
            {new Date().getFullYear()} GroupTherapy Records. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy">
              <span className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Privacy
              </span>
            </Link>
            <Link href="/terms">
              <span className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Terms
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
