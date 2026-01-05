import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, FileText, Eye, Plus, Trash2, Home, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, StaticPage, SiteSettings, MarqueeItem, StatItem } from "@/lib/database";
import { Link } from "wouter";
import { VideoUpload } from "@/components/video-upload";
import { ImageUpload } from "@/components/image-upload";
import { MarkdownEditor } from "@/components/markdown-editor";
import { sanitizeHtml } from "@/lib/sanitize-html";

type AboutPageModel = {
  heroTitle: string;
  heroSubtitle: string;
  missionHeading: string;
  missionText: string;
  stats: Array<{ value: string; label: string }>;
  timelineHeading: string;
  milestones: Array<{ year: string; title: string; description: string }>;
  teamHeading: string;
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
    bio?: string;
    imageUrl?: string;
    socialLinks?: { linkedin?: string; twitter?: string; instagram?: string };
    order?: number;
  }>;
  ctaHeading: string;
  ctaDescription: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
};

const defaultAboutPageModel: AboutPageModel = {
  heroTitle: "About Us",
  heroSubtitle: "The story behind the sound",
  missionHeading: "Our Mission",
  missionText:
    "GroupTherapy Records is more than a record label – it's a movement. We're dedicated to discovering, nurturing, and amplifying the most innovative voices in electronic music. From underground clubs to festival main stages, we're building a community that celebrates the transformative power of sound.",
  stats: [
    { value: "200+", label: "Releases" },
    { value: "50+", label: "Artists" },
    { value: "1M+", label: "Monthly Listeners" },
    { value: "100+", label: "Events" },
  ],
  timelineHeading: "Our Journey",
  milestones: [
    { year: "2015", title: "Founded", description: "GroupTherapy Records was born in a London basement studio" },
    { year: "2017", title: "First Festival", description: "Launched our flagship festival event" },
    { year: "2019", title: "100 Releases", description: "Reached 100 releases milestone" },
    { year: "2021", title: "Radio Launch", description: "GroupTherapy Radio goes live 24/7" },
    { year: "2023", title: "Global Expansion", description: "Opened offices in Berlin and Los Angeles" },
    { year: "2024", title: "Today", description: "Continuing to push boundaries in electronic music" },
  ],
  teamHeading: "Meet the Team",
  teamMembers: [
    {
      id: "1",
      name: "Alex Thompson",
      role: "Founder & CEO",
      bio: "Visionary behind GroupTherapy Records, Alex has been shaping electronic music culture for over 15 years.",
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
      socialLinks: { linkedin: "#", twitter: "#" },
      order: 1,
    },
    {
      id: "2",
      name: "Sarah Chen",
      role: "Head of A&R",
      bio: "With an ear for the next big sound, Sarah discovers and develops the talent that defines our roster.",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
      socialLinks: { linkedin: "#", instagram: "#" },
      order: 2,
    },
    {
      id: "3",
      name: "Marcus Rivera",
      role: "Creative Director",
      bio: "Marcus crafts the visual identity of GroupTherapy, from album art to live show production.",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
      socialLinks: { twitter: "#", instagram: "#" },
      order: 3,
    },
    {
      id: "4",
      name: "Emma Wilson",
      role: "Marketing Director",
      bio: "Emma leads our global marketing strategy, connecting artists with fans worldwide.",
      imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
      socialLinks: { linkedin: "#" },
      order: 4,
    },
  ],
  ctaHeading: "Want to work with us?",
  ctaDescription:
    "Whether you have a question about our artists, event promos, or submitting a demo, get in touch.",
  ctaPrimaryText: "Get in Touch",
  ctaSecondaryText: "Press Kit",
};

function tryParseAboutPageModel(raw: string): AboutPageModel | null {
  const trimmed = (raw || "").trim();
  if (!trimmed || !trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.heroTitle || !parsed.heroSubtitle) return null;
    return parsed as AboutPageModel;
  } catch {
    return null;
  }
}

function normalizeAboutPageModel(input: Partial<AboutPageModel> | null | undefined): AboutPageModel {
  const m: any = input || {};
  return {
    heroTitle: m.heroTitle ?? defaultAboutPageModel.heroTitle,
    heroSubtitle: m.heroSubtitle ?? defaultAboutPageModel.heroSubtitle,
    missionHeading: m.missionHeading ?? defaultAboutPageModel.missionHeading,
    missionText: m.missionText ?? defaultAboutPageModel.missionText,
    stats: Array.isArray(m.stats) ? m.stats : defaultAboutPageModel.stats,
    timelineHeading: m.timelineHeading ?? defaultAboutPageModel.timelineHeading,
    milestones: Array.isArray(m.milestones) ? m.milestones : defaultAboutPageModel.milestones,
    teamHeading: m.teamHeading ?? defaultAboutPageModel.teamHeading,
    teamMembers: Array.isArray(m.teamMembers) ? m.teamMembers : defaultAboutPageModel.teamMembers,
    ctaHeading: m.ctaHeading ?? defaultAboutPageModel.ctaHeading,
    ctaDescription: m.ctaDescription ?? defaultAboutPageModel.ctaDescription,
    ctaPrimaryText: m.ctaPrimaryText ?? defaultAboutPageModel.ctaPrimaryText,
    ctaSecondaryText: m.ctaSecondaryText ?? defaultAboutPageModel.ctaSecondaryText,
  };
}

function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown;
  
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>');
  
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>');
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$2</li>');
  
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('list-decimal')) {
      return `<ol class="my-2 space-y-1">${match}</ol>`;
    }
    return `<ul class="my-2 space-y-1">${match}</ul>`;
  });
  
  html = html.replace(/\n\n/g, '</p><p class="mb-4">');
  html = `<p class="mb-4">${html}</p>`;
  
  html = html.replace(/<p class="mb-4"><\/p>/g, '');
  html = html.replace(/<p class="mb-4">(<h[1-3])/g, '$1');
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
  html = html.replace(/<p class="mb-4">(<[uo]l)/g, '$1');
  html = html.replace(/(<\/[uo]l>)<\/p>/g, '$1');
  
  return html;
}

function MarkdownPreview({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);
  
  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none min-h-[300px] p-4 border rounded-md bg-muted/30"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

const iconOptions = [
  { value: "Disc3", label: "💿 Disc" },
  { value: "Radio", label: "📻 Radio" },
  { value: "Music2", label: "🎵 Music" },
  { value: "Users", label: "👥 Users" },
  { value: "Play", label: "▶️ Play" },
  { value: "Headphones", label: "🎧 Headphones" },
  { value: "Mic", label: "🎤 Mic" },
  { value: "Heart", label: "❤️ Heart" },
  { value: "Star", label: "⭐ Star" },
  { value: "Globe", label: "🌍 Globe" },
  { value: "Calendar", label: "📅 Calendar" },
  { value: "Trophy", label: "🏆 Trophy" },
];

const defaultMarqueeItems: MarqueeItem[] = [
  { text: "New Release: ECHOES EP", icon: "Disc3" },
  { text: "Live Radio 24/7", icon: "Radio" },
  { text: "Summer Tour 2025", icon: "Music2" },
  { text: "50+ Artists Worldwide", icon: "Users" },
  { text: "Stream Now on All Platforms", icon: "Play" },
  { text: "GroupTherapy Sessions", icon: "Headphones" },
];

const defaultStatsItems: StatItem[] = [
  { value: 50, suffix: "+", prefix: "", label: "Artists", icon: "Users" },
  { value: 200, suffix: "+", prefix: "", label: "Releases", icon: "Disc3" },
  { value: 24, suffix: "/7", prefix: "", label: "Radio", icon: "Radio" },
  { value: 1, suffix: "M+", prefix: "", label: "Streams", icon: "Headphones" },
];

export default function AdminStaticPages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    published: true,
  });

  const [aboutForm, setAboutForm] = useState<AboutPageModel>(defaultAboutPageModel);
  const [draggingTeamMemberId, setDraggingTeamMemberId] = useState<string | null>(null);
  const [dragOverTeamMemberId, setDragOverTeamMemberId] = useState<string | null>(null);

  const [heroSettings, setHeroSettings] = useState({
    heroTag: "",
    heroTitle: "GROUPTHERAPY",
    heroSubtitle: "The sound of tomorrow, today. Discover the future of the music you love.",
    heroBackgroundImage: "",
    heroBackgroundVideo: "",
    heroBackgroundType: "image" as "image" | "video",
    heroCtaText: "Explore Releases",
    heroCtaLink: "/releases",
    showHeroRadio: true,
  });

  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>(defaultMarqueeItems);
  const [marqueeSpeed, setMarqueeSpeed] = useState(40);

  const [statsItems, setStatsItems] = useState<StatItem[]>(defaultStatsItems);

  const { data: pages = [] } = useQuery<StaticPage[]>({
    queryKey: ["staticPages"],
    queryFn: queryFunctions.staticPages,
  });

  const { data: siteSettings, isLoading: isLoadingSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  // Update local state when site settings are fetched
  useEffect(() => {
    if (siteSettings) {
      setHeroSettings({
        heroTag: siteSettings.heroTag || "",
        heroTitle: siteSettings.heroTitle || "GROUPTHERAPY",
        heroSubtitle: siteSettings.heroSubtitle || "The sound of tomorrow, today. Discover the future of the music you love.",
        heroBackgroundImage: siteSettings.heroBackgroundImage || "",
        heroBackgroundVideo: siteSettings.heroBackgroundVideo || "",
        heroBackgroundType: siteSettings.heroBackgroundType || "image",
        heroCtaText: siteSettings.heroCtaText || "Explore Releases",
        heroCtaLink: siteSettings.heroCtaLink || "/releases",
        showHeroRadio: siteSettings.showHeroRadio ?? true,
      });
      setMarqueeItems(siteSettings.marqueeItems || defaultMarqueeItems);
      setMarqueeSpeed(siteSettings.marqueeSpeed || 40);
      setStatsItems(siteSettings.statsItems || defaultStatsItems);
    }
  }, [siteSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { id: string; page: Partial<StaticPage> }) => {
      return db.staticPages.update(data.id, data.page);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staticPages"] });
      toast({
        title: "Page updated",
        description: "The page has been updated successfully.",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save page",
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: Partial<SiteSettings>) => {
      return db.siteSettings.update(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast({
        title: "Success",
        description: "Homepage settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save homepage settings",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (page: StaticPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title || "",
      slug: page.slug || "",
      content: page.content || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      published: page.published ?? true,
    });

    if ((page.slug || "").toLowerCase() === "about") {
      const parsed = page.content ? tryParseAboutPageModel(page.content) : null;
      if (!parsed && (page.content || "").trim()) {
        toast({
          title: "About editor",
          description: "Existing About content is not in the structured format. Loading the default template.",
        });
      }
      setAboutForm(normalizeAboutPageModel(parsed || defaultAboutPageModel));
    }
    setIsDialogOpen(true);
  };

  const reorderAboutTeamMembers = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;

    setAboutForm((prev) => {
      const fromIndex = prev.teamMembers.findIndex((m) => m.id === fromId);
      const toIndex = prev.teamMembers.findIndex((m) => m.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const nextMembers = [...prev.teamMembers];
      const [moved] = nextMembers.splice(fromIndex, 1);
      if (!moved) return prev;
      nextMembers.splice(toIndex, 0, moved);

      const normalized = nextMembers.map((m, idx) => ({ ...m, order: idx + 1 }));
      return { ...prev, teamMembers: normalized };
    });
  };

  const handleSave = () => {
    if (!editingPage) return;

    const pageData: Partial<StaticPage> = {
      title: formData.title,
      content: (editingPage.slug || "").toLowerCase() === "about" ? JSON.stringify(aboutForm, null, 2) : formData.content,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      published: formData.published,
    };

    saveMutation.mutate({
      id: editingPage.id,
      page: pageData,
    });
  };

  const handleSaveHomepageSettings = () => {
    saveSettingsMutation.mutate({
      ...heroSettings,
      marqueeItems,
      marqueeSpeed,
      statsItems,
    });
  };

  const addMarqueeItem = () => {
    setMarqueeItems([...marqueeItems, { text: "", icon: "Disc3" }]);
  };

  const removeMarqueeItem = (index: number) => {
    setMarqueeItems(marqueeItems.filter((_, i) => i !== index));
  };

  const updateMarqueeItem = (index: number, field: keyof MarqueeItem, value: string) => {
    const updated = [...marqueeItems];
    const existing = updated[index];
    if (existing) {
      updated[index] = { ...existing, [field]: value };
      setMarqueeItems(updated);
    }
  };

  const addStatItem = () => {
    setStatsItems([...statsItems, { value: 0, suffix: "", prefix: "", label: "", icon: "Users" }]);
  };

  const removeStatItem = (index: number) => {
    setStatsItems(statsItems.filter((_, i) => i !== index));
  };

  const updateStatItem = (index: number, field: keyof StatItem, value: string | number) => {
    const updated = [...statsItems];
    const existing = updated[index];
    if (existing) {
      updated[index] = { ...existing, [field]: value };
      setStatsItems(updated);
    }
  };

  if (isLoadingSettings) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Content Management</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Manage homepage settings and static pages</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Homepage Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Hero Section</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="heroTag">Hero Tag</Label>
                  <Input
                    id="heroTag"
                    value={heroSettings.heroTag}
                    onChange={(e) => setHeroSettings({ ...heroSettings, heroTag: e.target.value })}
                    placeholder="New Release"
                  />
                </div>
                <div>
                  <Label htmlFor="heroTitle">Title</Label>
                  <Input
                    id="heroTitle"
                    value={heroSettings.heroTitle}
                    onChange={(e) => setHeroSettings({ ...heroSettings, heroTitle: e.target.value })}
                    placeholder="GROUPTHERAPY"
                  />
                </div>
                <div>
                  <Label htmlFor="heroSubtitle">Subtitle</Label>
                  <Textarea
                    id="heroSubtitle"
                    value={heroSettings.heroSubtitle}
                    onChange={(e) => setHeroSettings({ ...heroSettings, heroSubtitle: e.target.value })}
                    placeholder="The sound of tomorrow, today..."
                    rows={2}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="heroBackgroundType">Background Type</Label>
                    <Select
                      value={heroSettings.heroBackgroundType}
                      onValueChange={(value: "image" | "video") => setHeroSettings({ ...heroSettings, heroBackgroundType: value })}
                    >
                      <SelectTrigger id="heroBackgroundType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {heroSettings.heroBackgroundType === "image" ? (
                    <div>
                      <Label htmlFor="heroBackgroundImage">Background Image</Label>
                      <ImageUpload
                        onUploadComplete={(url) => setHeroSettings({ ...heroSettings, heroBackgroundImage: url })}
                        currentImage={heroSettings.heroBackgroundImage}
                        folder="hero"
                        aspectRatio="banner"
                      />
                      <Input
                        id="heroBackgroundImage"
                        value={heroSettings.heroBackgroundImage}
                        onChange={(e) => setHeroSettings({ ...heroSettings, heroBackgroundImage: e.target.value })}
                        placeholder="Or paste image URL"
                        className="mt-2"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="heroBackgroundVideo">Background Video</Label>
                      <VideoUpload
                        onUploadComplete={(url) => setHeroSettings({ ...heroSettings, heroBackgroundVideo: url })}
                        currentVideo={heroSettings.heroBackgroundVideo}
                        folder="hero"
                      />
                      <Input
                        id="heroBackgroundVideo"
                        value={heroSettings.heroBackgroundVideo}
                        onChange={(e) => setHeroSettings({ ...heroSettings, heroBackgroundVideo: e.target.value })}
                        placeholder="Or paste video URL"
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="heroCtaText">CTA Text</Label>
                    <Input
                      id="heroCtaText"
                      value={heroSettings.heroCtaText}
                      onChange={(e) => setHeroSettings({ ...heroSettings, heroCtaText: e.target.value })}
                      placeholder="Explore Releases"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heroCtaLink">CTA Link</Label>
                    <Input
                      id="heroCtaLink"
                      value={heroSettings.heroCtaLink}
                      onChange={(e) => setHeroSettings({ ...heroSettings, heroCtaLink: e.target.value })}
                      placeholder="/releases"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    id="showHeroRadio"
                    checked={heroSettings.showHeroRadio}
                    onCheckedChange={(checked) => setHeroSettings({ ...heroSettings, showHeroRadio: checked })}
                  />
                  <Label htmlFor="showHeroRadio">Show Radio Button</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-lg">Marquee</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Speed:</span>
                  <Input
                    type="number"
                    value={marqueeSpeed}
                    onChange={(e) => setMarqueeSpeed(parseInt(e.target.value) || 40)}
                    className="w-16 h-8"
                    min={10}
                    max={100}
                  />
                  <span>s</span>
                </div>
              </div>
              <div className="space-y-2">
                {marqueeItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={item.icon}
                      onValueChange={(value) => updateMarqueeItem(index, "icon", value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={item.text}
                      onChange={(e) => updateMarqueeItem(index, "text", e.target.value)}
                      placeholder="Marquee text..."
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMarqueeItem(index)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addMarqueeItem} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Stats</h3>
              <div className="space-y-2">
                {statsItems.map((item, index) => (
                  <div key={index} className="rounded-lg border border-border/50 bg-muted/10 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={item.icon}
                        onValueChange={(value) => updateStatItem(index, "icon", value)}
                      >
                        <SelectTrigger className="w-full sm:w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStatItem(index)}
                        className="ml-auto text-muted-foreground hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                      <Input
                        value={item.prefix}
                        onChange={(e) => updateStatItem(index, "prefix", e.target.value)}
                        placeholder="$"
                        className="w-full sm:w-12"
                      />
                      <Input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateStatItem(index, "value", parseInt(e.target.value) || 0)}
                        placeholder="50"
                        className="w-full sm:w-20"
                      />
                      <Input
                        value={item.suffix}
                        onChange={(e) => updateStatItem(index, "suffix", e.target.value)}
                        placeholder="+"
                        className="w-full sm:w-14"
                      />
                    </div>

                    <Input
                      value={item.label}
                      onChange={(e) => updateStatItem(index, "label", e.target.value)}
                      placeholder="Label"
                      className="w-full"
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addStatItem} className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSaveHomepageSettings} disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending ? "Saving..." : "Save Homepage Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Static Pages</h2>
          <p className="text-muted-foreground mb-4">Manage legal and informational pages</p>
        </div>

        <div className="grid gap-4">
          {pages.map((page) => (
            <Card
              key={page.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleEdit(page)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{page.title}</h3>
                      {!page.published && <Badge variant="secondary">Draft</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/${page.slug}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(page);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No static pages found. Run the database schema to create default pages.
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Edit {editingPage?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug (read-only)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {(editingPage?.slug || formData.slug).toLowerCase() === "about" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Hero</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={aboutForm.heroTitle}
                        onChange={(e) => setAboutForm({ ...aboutForm, heroTitle: e.target.value })}
                        placeholder="Hero title"
                      />
                      <Input
                        value={aboutForm.heroSubtitle}
                        onChange={(e) => setAboutForm({ ...aboutForm, heroSubtitle: e.target.value })}
                        placeholder="Hero subtitle"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Mission</Label>
                    <Input
                      value={aboutForm.missionHeading}
                      onChange={(e) => setAboutForm({ ...aboutForm, missionHeading: e.target.value })}
                      placeholder="Heading"
                    />
                    <Textarea
                      rows={4}
                      value={aboutForm.missionText}
                      onChange={(e) => setAboutForm({ ...aboutForm, missionText: e.target.value })}
                      placeholder="Mission text"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Stats</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAboutForm({
                            ...aboutForm,
                            stats: [...aboutForm.stats, { value: "", label: "" }],
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {aboutForm.stats.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                          <Input
                            value={s.value}
                            onChange={(e) => {
                              const next = [...aboutForm.stats];
                              const existing = next[idx];
                              if (!existing) return;
                              next[idx] = { ...existing, value: e.target.value };
                              setAboutForm({ ...aboutForm, stats: next });
                            }}
                            placeholder="Value (e.g. 50+)"
                          />
                          <Input
                            value={s.label}
                            onChange={(e) => {
                              const next = [...aboutForm.stats];
                              const existing = next[idx];
                              if (!existing) return;
                              next[idx] = { ...existing, label: e.target.value };
                              setAboutForm({ ...aboutForm, stats: next });
                            }}
                            placeholder="Label"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-10 w-10"
                            onClick={() =>
                              setAboutForm({
                                ...aboutForm,
                                stats: aboutForm.stats.filter((_, i) => i !== idx),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Timeline</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAboutForm({
                            ...aboutForm,
                            milestones: [...aboutForm.milestones, { year: "", title: "", description: "" }],
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <Input
                      value={aboutForm.timelineHeading}
                      onChange={(e) => setAboutForm({ ...aboutForm, timelineHeading: e.target.value })}
                      placeholder="Timeline heading"
                    />
                    <div className="space-y-3">
                      {aboutForm.milestones.map((m, idx) => (
                        <div key={idx} className="rounded-md border p-3 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Input
                              value={m.year}
                              onChange={(e) => {
                                const next = [...aboutForm.milestones];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, year: e.target.value };
                                setAboutForm({ ...aboutForm, milestones: next });
                              }}
                              placeholder="Year"
                            />
                            <Input
                              className="sm:col-span-2"
                              value={m.title}
                              onChange={(e) => {
                                const next = [...aboutForm.milestones];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, title: e.target.value };
                                setAboutForm({ ...aboutForm, milestones: next });
                              }}
                              placeholder="Title"
                            />
                          </div>
                          <Textarea
                            rows={2}
                            value={m.description}
                            onChange={(e) => {
                              const next = [...aboutForm.milestones];
                              const existing = next[idx];
                              if (!existing) return;
                              next[idx] = { ...existing, description: e.target.value };
                              setAboutForm({ ...aboutForm, milestones: next });
                            }}
                            placeholder="Description"
                          />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setAboutForm({
                                  ...aboutForm,
                                  milestones: aboutForm.milestones.filter((_, i) => i !== idx),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Team</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAboutForm({
                            ...aboutForm,
                            teamMembers: [
                              ...aboutForm.teamMembers,
                              { id: String(Date.now()), name: "", role: "", bio: "", imageUrl: "", order: aboutForm.teamMembers.length + 1 },
                            ],
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <Input
                      value={aboutForm.teamHeading}
                      onChange={(e) => setAboutForm({ ...aboutForm, teamHeading: e.target.value })}
                      placeholder="Team heading"
                    />
                    <div className="space-y-3">
                      {aboutForm.teamMembers.map((tm, idx) => (
                        <div
                          key={tm.id || String(idx)}
                          className={`rounded-md border p-3 space-y-3 ${dragOverTeamMemberId === tm.id ? "ring-2 ring-primary" : ""}`}
                          onDragOver={(e) => {
                            if (!draggingTeamMemberId) return;
                            e.preventDefault();
                            setDragOverTeamMemberId(tm.id);
                          }}
                          onDragLeave={() => {
                            if (dragOverTeamMemberId === tm.id) setDragOverTeamMemberId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromId = e.dataTransfer.getData("text/plain") || draggingTeamMemberId;
                            if (!fromId || !tm.id) return;
                            reorderAboutTeamMembers(fromId, tm.id);
                            setDraggingTeamMemberId(null);
                            setDragOverTeamMemberId(null);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="inline-flex items-center gap-2 text-xs text-muted-foreground select-none"
                              draggable
                              onDragStart={(e) => {
                                if (!tm.id) return;
                                setDraggingTeamMemberId(tm.id);
                                e.dataTransfer.setData("text/plain", tm.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggingTeamMemberId(null);
                                setDragOverTeamMemberId(null);
                              }}
                            >
                              <GripVertical className="h-4 w-4" />
                              Drag to reorder
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              value={tm.name}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, name: e.target.value };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="Name"
                            />
                            <Input
                              value={tm.role}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, role: e.target.value };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="Role"
                            />
                          </div>

                          <Textarea
                            rows={2}
                            value={tm.bio || ""}
                            onChange={(e) => {
                              const next = [...aboutForm.teamMembers];
                              const existing = next[idx];
                              if (!existing) return;
                              next[idx] = { ...existing, bio: e.target.value };
                              setAboutForm({ ...aboutForm, teamMembers: next });
                            }}
                            placeholder="Bio"
                          />

                          <div className="space-y-2">
                            <Label>Photo</Label>
                            <ImageUpload
                              currentImage={tm.imageUrl || ""}
                              onUploadComplete={(url) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, imageUrl: url };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              bucket="media"
                              folder="about/team"
                              aspectRatio="square"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <Input
                              value={String(tm.order ?? "")}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = { ...existing, order: parseInt(e.target.value) || 0 };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="Order"
                            />
                            <Input
                              className="sm:col-span-3"
                              value={tm.socialLinks?.linkedin || ""}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = {
                                  ...existing,
                                  socialLinks: { ...(existing.socialLinks || {}), linkedin: e.target.value },
                                };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="LinkedIn URL"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              value={tm.socialLinks?.twitter || ""}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = {
                                  ...existing,
                                  socialLinks: { ...(existing.socialLinks || {}), twitter: e.target.value },
                                };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="X/Twitter URL"
                            />
                            <Input
                              value={tm.socialLinks?.instagram || ""}
                              onChange={(e) => {
                                const next = [...aboutForm.teamMembers];
                                const existing = next[idx];
                                if (!existing) return;
                                next[idx] = {
                                  ...existing,
                                  socialLinks: { ...(existing.socialLinks || {}), instagram: e.target.value },
                                };
                                setAboutForm({ ...aboutForm, teamMembers: next });
                              }}
                              placeholder="Instagram URL"
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setAboutForm({
                                  ...aboutForm,
                                  teamMembers: aboutForm.teamMembers.filter((_, i) => i !== idx),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>CTA</Label>
                    <Input
                      value={aboutForm.ctaHeading}
                      onChange={(e) => setAboutForm({ ...aboutForm, ctaHeading: e.target.value })}
                      placeholder="CTA heading"
                    />
                    <Textarea
                      rows={2}
                      value={aboutForm.ctaDescription}
                      onChange={(e) => setAboutForm({ ...aboutForm, ctaDescription: e.target.value })}
                      placeholder="CTA description"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={aboutForm.ctaPrimaryText}
                        onChange={(e) => setAboutForm({ ...aboutForm, ctaPrimaryText: e.target.value })}
                        placeholder="Primary button text"
                      />
                      <Input
                        value={aboutForm.ctaSecondaryText}
                        onChange={(e) => setAboutForm({ ...aboutForm, ctaSecondaryText: e.target.value })}
                        placeholder="Secondary button text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAboutForm(defaultAboutPageModel)}
                    >
                      Load Template
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Content (Markdown)</Label>
                  <div className="mt-2">
                    <MarkdownEditor
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      placeholder="Enter content using Markdown..."
                      minHeight="350px"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="metaTitle">SEO Title (Optional)</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="Page title for search engines"
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">SEO Description (Optional)</Label>
                <Textarea
                  id="metaDescription"
                  rows={2}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Brief description for search engines"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}