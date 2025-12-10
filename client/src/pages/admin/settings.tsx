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

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    siteName: "GroupTherapy Records",
    tagline: "Electronic Music Label",
    email: "info@grouptherapy.com",
    phone: "+1 (555) 123-4567",
    address: "123 Music Street, Los Angeles, CA 90001",
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

  // Update local state when About page data is loaded
  useEffect(() => {
    if (aboutPage) {
      // Extract mission and content from the about page content
      const content = aboutPage.content || "";
      const missionMatch = content.match(/<h3>Our Mission<\/h3><p>(.*?)<\/p>/s);
      const mission = missionMatch ? missionMatch[1] : "";

      setAboutContent({
        mission: mission,
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

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
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
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
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

          <Button onClick={handleSave} size="lg">
            Save Settings
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
                  <Label htmlFor="aboutContent">Full Page Content (HTML)</Label>
                  <Textarea
                    id="aboutContent"
                    rows={15}
                    value={aboutContent.content}
                    onChange={(e) => setAboutContent({ ...aboutContent, content: e.target.value })}
                    placeholder="Enter full HTML content for the About page..."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can use HTML tags here. If you only update the mission, the rest of the page will use the default template.
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