import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { db, type StaticPage } from "@/lib/database";
import { Loader2 } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    siteName: "GroupTherapy Records",
    tagline: "Electronic Music Label",
    email: "",
    emailSubtext: "",
    phone: "",
    phoneSubtext: "",
    address: "",
    addressSubtext: "",
    description: "GroupTherapy is a cutting-edge electronic music label...",
    spotify: "https://spotify.com/grouptherapy",
    instagram: "https://instagram.com/grouptherapy",
    soundcloud: "https://soundcloud.com/grouptherapy",
  });

  const [aboutContent, setAboutContent] = useState({
    mission: "",
    content: "",
  });

  // Fetch About page from database
  const { data: aboutPage, isLoading } = useQuery<StaticPage | null>({
    queryKey: ["staticPage", "about"],
    queryFn: () => db.staticPages.getBySlug("about"),
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  useEffect(() => {
    if (!siteSettings) return;
    setSettings((prev) => ({
      ...prev,
      email: siteSettings.contactEmail || prev.email,
      emailSubtext: siteSettings.contactEmailSubtext || prev.emailSubtext,
      phone: siteSettings.contactPhone || prev.phone,
      phoneSubtext: siteSettings.contactPhoneSubtext || prev.phoneSubtext,
      address: siteSettings.contactAddress || prev.address,
      addressSubtext: siteSettings.contactAddressSubtext || prev.addressSubtext,
    }));
  }, [siteSettings]);

  // Update local state when About page data is loaded
  useEffect(() => {
    if (aboutPage) {
      // Extract mission and content from the about page content
      const content = aboutPage.content || "";
      const missionMatch = content.match(/<h3>Our Mission<\/h3><p>(.*?)<\/p>/s);
      const mission = missionMatch?.[1] ?? "";

      setAboutContent({
        mission,
        content: content,
      });
    }
  }, [aboutPage]);

  // Mutation to update About page
  const updateAboutMutation = useMutation({
    mutationFn: async (data: { mission: string; content: string }) => {
      if (!aboutPage) throw new Error("About page not found");

      // Construct the content with mission statement
      const updatedContent = data.content.includes("<h3>Our Mission</h3>")
        ? data.content
        : `<h2>About GroupTherapy</h2><p>GroupTherapy is a cutting-edge electronic music label dedicated to discovering and promoting the most innovative sounds in electronic music.</p><h3>Our Mission</h3><p>${data.mission}</p><h3>What We Do</h3><p>From releasing groundbreaking music to hosting unforgettable events and running our 24/7 radio station, we are committed to building a global community of music lovers.</p>`;

      return db.staticPages.update(aboutPage.id, {
        content: updatedContent,
        title: "About GroupTherapy",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staticPage", "about"] });
      queryClient.invalidateQueries({ queryKey: ["staticPages"] });
      toast({
        title: "Success",
        description: "About page has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update About page",
        variant: "destructive",
      });
    },
  });

  const updateSiteSettingsMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      emailSubtext: string;
      phone: string;
      phoneSubtext: string;
      address: string;
      addressSubtext: string;
    }) => {
      return db.siteSettings.update({
        contactEmail: data.email,
        contactEmailSubtext: data.emailSubtext,
        contactPhone: data.phone,
        contactPhoneSubtext: data.phoneSubtext,
        contactAddress: data.address,
        contactAddressSubtext: data.addressSubtext,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSiteSettingsMutation.mutate({
      email: settings.email,
      emailSubtext: settings.emailSubtext,
      phone: settings.phone,
      phoneSubtext: settings.phoneSubtext,
      address: settings.address,
      addressSubtext: settings.addressSubtext,
    });
  };

  const handleSaveAbout = () => {
    updateAboutMutation.mutate({
      mission: aboutContent.mission,
      content: aboutContent.content,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your site settings and configuration</p>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How people can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Small text shown under the email on the Contact page</p>
                <Input
                  id="emailSubtext"
                  value={settings.emailSubtext}
                  onChange={(e) => setSettings({ ...settings, emailSubtext: e.target.value })}
                  placeholder="e.g. We'll respond within 24 hours"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Small text shown under the phone on the Contact page</p>
                <Input
                  id="phoneSubtext"
                  value={settings.phoneSubtext}
                  onChange={(e) => setSettings({ ...settings, phoneSubtext: e.target.value })}
                  placeholder="e.g. Mon-Fri, 9am-6pm"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Small text shown under the address on the Contact page</p>
                <Input
                  id="addressSubtext"
                  value={settings.addressSubtext}
                  onChange={(e) => setSettings({ ...settings, addressSubtext: e.target.value })}
                  placeholder="e.g. Shoreditch Creative Hub"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="spotify">Spotify URL</Label>
                <Input
                  id="spotify"
                  value={settings.spotify}
                  onChange={(e) => setSettings({ ...settings, spotify: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  value={settings.instagram}
                  onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="soundcloud">SoundCloud URL</Label>
                <Input
                  id="soundcloud"
                  value={settings.soundcloud}
                  onChange={(e) => setSettings({ ...settings, soundcloud: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} size="lg" disabled={updateSiteSettingsMutation.isPending}>
            {updateSiteSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>

        {/* About Page Content */}
        <Card>
          <CardHeader>
            <CardTitle>About Page Content</CardTitle>
            <CardDescription>Manage the content for the About page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Textarea
                    id="mission"
                    rows={3}
                    value={aboutContent.mission}
                    onChange={(e) => setAboutContent({ ...aboutContent, mission: e.target.value })}
                    placeholder="Our mission statement..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be displayed in the "Our Mission" section
                  </p>
                </div>
                <div>
                  <Label htmlFor="aboutContent">Full Page Content (Markdown)</Label>
                  <MarkdownEditor
                    value={aboutContent.content}
                    onChange={(value) => setAboutContent({ ...aboutContent, content: value })}
                    placeholder="Enter content for the About page using Markdown..."
                    minHeight="300px"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use Markdown formatting. If you only update the mission, the rest of the page will use the default template.
                  </p>
                </div>
                <Button
                  onClick={handleSaveAbout}
                  disabled={updateAboutMutation.isPending}
                  size="lg"
                >
                  {updateAboutMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save About Page"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}