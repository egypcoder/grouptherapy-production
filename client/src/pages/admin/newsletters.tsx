import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Send, Loader2, Trash2, Download, Sparkles, Settings, CheckCircle2, AlertCircle, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, NewsletterCampaign, NewsletterSubscriber, NewsletterTemplate } from "@/lib/database";
import { generateContent, isGeminiConfigured } from "@/lib/gemini";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { NewsletterTemplateBuilderDialog } from "@/components/newsletter-template-builder";
import { NewsletterCampaignBuilderDialog } from "@/components/newsletter-campaign-builder";
import { fetchEmailServiceSettings, updateEmailServiceSettings } from "@/lib/email-service-settings";
import { sendNewsletterViaApi } from "@/lib/newsletter-send";

interface EmailServiceConfig {
  service: string;
  apiKey?: string;
  apiUrl?: string;
  fromEmail: string;
  senderName: string;
}

export default function AdminNewsletters() {
  const { toast } = useToast();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<NewsletterTemplate | null>(null);
  const [isCampaignBuilderOpen, setIsCampaignBuilderOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<NewsletterCampaign | null>(null);
  const [initialCampaignTemplateId, setInitialCampaignTemplateId] = useState<string | undefined>(undefined);
  const [emailData, setEmailData] = useState({
    subject: "",
    content: "",
    prompt: "",
  });

  const { data: subscribers = [] } = useQuery<NewsletterSubscriber[]>({
    queryKey: ["newsletterSubscribers"],
    queryFn: queryFunctions.newsletterSubscribers,
  });

  const { data: templates = [] } = useQuery<NewsletterTemplate[]>({
    queryKey: ["newsletterTemplates"],
    queryFn: queryFunctions.newsletterTemplates,
  });

  const { data: campaigns = [] } = useQuery<NewsletterCampaign[]>({
    queryKey: ["newsletterCampaigns"],
    queryFn: queryFunctions.newsletterCampaigns,
  });

  const { data: releases = [] } = useQuery<any[]>({
    queryKey: ["releasesPublished"],
    queryFn: queryFunctions.releasesPublished as any,
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["eventsUpcoming"],
    queryFn: queryFunctions.eventsUpcoming as any,
  });

  const { data: emailServiceSettings } = useQuery({
    queryKey: ["emailServiceSettings"],
    queryFn: fetchEmailServiceSettings,
  });

  const activeSubscribers = subscribers.filter((s) => s.active);
  const defaultTemplate = templates.find((t) => t.isDefault) || templates[0] || null;

  const emailConfig: EmailServiceConfig = emailServiceSettings
    ? {
        service: emailServiceSettings.service,
        apiUrl: emailServiceSettings.apiUrl || "",
        fromEmail: emailServiceSettings.fromEmail || "",
        senderName: emailServiceSettings.senderName || "",
      }
    : { service: "none", fromEmail: "", senderName: "" };

  const [emailSettings, setEmailSettings] = useState<EmailServiceConfig>(emailConfig);

  useEffect(() => {
    if (!emailServiceSettings) return;
    setEmailSettings({
      service: emailServiceSettings.service,
      apiKey: "",
      apiUrl: emailServiceSettings.apiUrl || "",
      fromEmail: emailServiceSettings.fromEmail || "",
      senderName: emailServiceSettings.senderName || "",
    });
  }, [emailServiceSettings]);

  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (config: EmailServiceConfig) => {
      const apiKey = String(config.apiKey || "").trim();
      return updateEmailServiceSettings({
        service: config.service,
        apiUrl: config.apiUrl,
        fromEmail: config.fromEmail,
        senderName: config.senderName,
        apiKey: apiKey.length ? apiKey : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailServiceSettings"] });
      toast({
        title: "Settings Saved",
        description: "Email service configuration has been updated.",
      });
      setIsSettingsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.newsletterSubscribers.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterSubscribers"] });
      toast({
        title: "Subscriber removed",
        description: "The subscriber has been deleted.",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.newsletterTemplates.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterTemplates"] });
      toast({
        title: "Template deleted",
        description: "The template has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template.",
        variant: "destructive",
      });
    },
  });

  const setDefaultTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await db.newsletterTemplates.setDefault(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletterTemplates"] });
      toast({
        title: "Default template updated",
        description: "This template will be used for new campaigns.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set default template.",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string; recipients: string[] }) => {
      if (data.recipients.length === 0) {
        throw new Error("No recipients to send to.");
      }

      await sendNewsletterViaApi({
        to: data.recipients,
        subject: data.subject,
        html: data.content,
      });
    },
    onSuccess: () => {
      toast({
        title: "Newsletter Sent!",
        description: `Email sent to ${activeSubscribers.length} subscribers.`,
      });
      setIsComposeOpen(false);
      setEmailData({ subject: "", content: "", prompt: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send newsletter.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateContent = async () => {
    if (!emailData.prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
const prompt = `Write a professional, energetic, and mobile-responsive email newsletter for a music record label called GroupTherapy Records.
Topic: ${emailData.prompt}

Requirements:
1. SUBJECT LINE:
   - Create an engaging, click-worthy subject line that fits the electronic music industry vibe.
2. EMAIL BODY (HTML format):
   - Use inline CSS only.
   - Follow a dark theme with primary accent color #8B5CF6 (light purple/blue) and clean modern fonts.
   - Include our logo at the top: "https://grouptherapyrecords.com/logo.png"
   - Structure content into clear sections:
     a) Header/intro
     b) Main content or featured news
     c) Call-to-action buttons
     d) Footer with © ${new Date().getFullYear()} GroupTherapy Records. All rights reserved.
   - Ensure mobile responsiveness (scales nicely on mobile devices)
   - Use a professional but energetic tone, matching the electronic music scene.
3. DO NOT include extra commentary outside of the HTML.

Format the response exactly like this:
SUBJECT: [subject line here]
---
[Full HTML content here]`;

      const result = await generateContent(prompt);

      if (result.startsWith("Error:")) {
        toast({
          title: "Generation Failed",
          description: result,
          variant: "destructive",
        });
        return;
      }

      // Parse the result
      const parts = result.split("---");
      if (parts.length >= 2) {
        const subjectLine = (parts[0] || "").replace("SUBJECT:", "").trim();
        const htmlContent = parts[1] || "";
        
        setEmailData((prev) => ({
          ...prev,
          subject: subjectLine,
          content: htmlContent,
        }));

        toast({
          title: "Content Generated!",
          description: "Your newsletter content has been created.",
        });
      } else {
        setEmailData((prev) => ({
          ...prev,
          content: result,
        }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate content.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendNewsletter = () => {
    if (!emailData.subject.trim() || !emailData.content.trim()) {
      toast({
        title: "Error",
        description: "Please provide both subject and content.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      subject: emailData.subject,
      content: emailData.content,
      recipients: activeSubscribers.map((s) => s.email),
    });
  };

  const handleExportSubscribers = () => {
    const csv = [
      ["Email", "Name", "Source", "Subscribed At", "Status"].join(","),
      ...subscribers.map((s) =>
        [
          s.email,
          s.name || "",
          s.source || "",
          new Date(s.subscribedAt).toLocaleString(),
          s.active ? "Active" : "Unsubscribed",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEmailSettings = () => {
    if (!emailSettings.service || emailSettings.service === "none") {
      toast({
        title: "Error",
        description: "Please select an email service.",
        variant: "destructive",
      });
      return;
    }

    if (!emailSettings.fromEmail) {
      toast({
        title: "Error",
        description: "Please provide a 'From' email address.",
        variant: "destructive",
      });
      return;
    }

    const hasStoredApiKey = !!emailServiceSettings?.hasApiKey;
    const apiKeyProvided = !!String(emailSettings.apiKey || "").trim();

    if ((emailSettings.service === "resend" || emailSettings.service === "sendgrid") && !apiKeyProvided && !hasStoredApiKey) {
      toast({
        title: "Error",
        description: "Please provide an API key.",
        variant: "destructive",
      });
      return;
    }

    if ((emailSettings.service === "ses" || emailSettings.service === "smtp") && !emailSettings.apiUrl) {
      toast({
        title: "Error",
        description: "Please provide an API URL.",
        variant: "destructive",
      });
      return;
    }

    saveEmailSettingsMutation.mutate(emailSettings);
  };

  const isConfigured = emailConfig.service && emailConfig.service !== "none" && 
    ((emailConfig.service === "resend" || emailConfig.service === "sendgrid") ? !!emailServiceSettings?.hasApiKey : true) &&
    ((emailConfig.service === "ses" || emailConfig.service === "smtp") ? !!emailConfig.apiUrl : true) &&
    !!emailConfig.fromEmail;

  const previewData = {
    siteUrl: (import.meta as any).env?.VITE_SITE_URL || undefined,
    releases: (releases || []).map((r: any) => ({
      title: r.title,
      artistName: r.artistName,
      coverUrl: r.coverUrl,
      spotifyUrl: r.spotifyUrl,
      appleMusicUrl: r.appleMusicUrl,
      soundcloudUrl: r.soundcloudUrl,
      slug: r.slug,
    })),
    events: (events || []).map((e: any) => ({
      title: e.title,
      date: e.date,
      city: e.city,
      country: e.country,
      ticketUrl: e.ticketUrl,
      slug: e.slug,
      imageUrl: e.imageUrl,
    })),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Newsletter Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage subscribers and send newsletters
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full sm:w-auto">
            <Button className="w-full sm:w-auto" variant="outline" onClick={handleExportSubscribers}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Email Settings
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setCampaignToEdit(null);
                setInitialCampaignTemplateId(defaultTemplate?.id);
                setIsCampaignBuilderOpen(true);
              }}
              disabled={!isConfigured || templates.length === 0}
            >
              <Mail className="h-4 w-4 mr-2" />
              Compose Newsletter
            </Button>
          </div>
        </div>

        {/* Email Service Status */}
        {!isConfigured && (
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Email service not configured
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Please configure your email service settings to send newsletters.
                  </p>
                </div>
                <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => setIsSettingsOpen(true)}>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isConfigured && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Email service configured: {emailConfig.service}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                    From: {emailConfig.fromEmail}
                  </p>
                </div>
                <Button className="w-full sm:w-auto" size="sm" variant="ghost" onClick={() => setIsSettingsOpen(true)}>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="subscribers" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="subscribers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tracking-tight">{subscribers.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Badge variant="default">{activeSubscribers.length}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tracking-tight text-green-600 dark:text-green-400">
                    {activeSubscribers.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ready to receive</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
                  <Badge variant="secondary">{subscribers.length - activeSubscribers.length}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tracking-tight text-muted-foreground">
                    {subscribers.length - activeSubscribers.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Opted out</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Subscribers</CardTitle>
                <CardDescription>Manage your newsletter subscriber list</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[280px]">Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Name</TableHead>
                        <TableHead className="hidden md:table-cell">Source</TableHead>
                        <TableHead className="hidden md:table-cell">Subscribed</TableHead>
                        <TableHead className="w-[140px]">Status</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">
                            <div className="max-w-[260px] truncate">{subscriber.email}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{subscriber.name || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">{subscriber.source || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {new Date(subscriber.subscribedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={subscriber.active ? "default" : "secondary"}>
                              {subscriber.active ? "Active" : "Unsubscribed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(subscriber.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {subscribers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No subscribers yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Templates</h2>
                <p className="text-sm text-muted-foreground">Design reusable newsletter templates.</p>
              </div>
              <Button
                onClick={() => {
                  setTemplateToEdit(null);
                  setIsTemplateBuilderOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Saved Templates</CardTitle>
                <CardDescription>Pick a default template for new campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Updated</TableHead>
                        <TableHead className="w-[120px]">Default</TableHead>
                        <TableHead className="w-[140px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((t) => (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer"
                          tabIndex={0}
                          onClick={() => {
                            setTemplateToEdit(t);
                            setIsTemplateBuilderOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            setTemplateToEdit(t);
                            setIsTemplateBuilderOpen(true);
                          }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span>{t.name}</span>
                              {t.isDefault && <Badge variant="default">Default</Badge>}
                            </div>
                            {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</div>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={t.isDefault ? "secondary" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDefaultTemplateMutation.mutate(t.id);
                              }}
                              disabled={setDefaultTemplateMutation.isPending || t.isDefault}
                            >
                              Set Default
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setTemplateToEdit(t);
                                setIsTemplateBuilderOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteTemplateMutation.mutate(t.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {templates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No templates yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Campaigns</h2>
                <p className="text-sm text-muted-foreground">Create drafts from a template and send to subscribers.</p>
              </div>
              <Button
                onClick={() => {
                  setCampaignToEdit(null);
                  setInitialCampaignTemplateId(defaultTemplate?.id);
                  setIsCampaignBuilderOpen(true);
                }}
                disabled={templates.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Campaign History</CardTitle>
                <CardDescription>Drafts and sent newsletters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="hidden md:table-cell">Template</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="w-[140px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((c) => {
                        const t = templates.find((x) => x.id === c.templateId);
                        return (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer"
                            tabIndex={0}
                            onClick={() => {
                              setCampaignToEdit(c);
                              setInitialCampaignTemplateId(undefined);
                              setIsCampaignBuilderOpen(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              setCampaignToEdit(c);
                              setInitialCampaignTemplateId(undefined);
                              setIsCampaignBuilderOpen(true);
                            }}
                          >
                            <TableCell className="font-medium">
                              {c.subject || "(No subject)"}
                              {c.preheader && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.preheader}</div>}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t?.name || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={c.status === "sent" ? "default" : "secondary"}>{c.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setCampaignToEdit(c);
                                  setInitialCampaignTemplateId(undefined);
                                  setIsCampaignBuilderOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No campaigns yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <NewsletterTemplateBuilderDialog
        open={isTemplateBuilderOpen}
        onOpenChange={setIsTemplateBuilderOpen}
        template={templateToEdit}
        previewData={previewData as any}
      />

      <NewsletterCampaignBuilderDialog
        open={isCampaignBuilderOpen}
        onOpenChange={setIsCampaignBuilderOpen}
        templates={templates}
        campaign={campaignToEdit}
        initialTemplateId={initialCampaignTemplateId}
        previewData={previewData as any}
        onSend={async ({ subject, html }) => {
          if (activeSubscribers.length === 0) {
            throw new Error("No recipients to send to.");
          }

          await sendNewsletterViaApi({
            to: activeSubscribers.map((s) => s.email),
            subject,
            html,
          });

          toast({
            title: "Newsletter Sent!",
            description: `Email sent to ${activeSubscribers.length} subscribers.`,
          });
        }}
      />

      {/* Email Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Email Service Configuration</DialogTitle>
            <DialogDescription>
              Configure your email service to send newsletters to subscribers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service">Email Service</Label>
              <Select
                value={emailSettings.service}
                onValueChange={(value) => setEmailSettings({ ...emailSettings, service: value, apiKey: "", apiUrl: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select email service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Not Configured)</SelectItem>
                  <SelectItem value="resend">Resend (Recommended)</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="ses">AWS SES</SelectItem>
                  <SelectItem value="smtp">SMTP (via Backend)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {emailSettings.service === "resend" && "Sign up at resend.com - Easy setup, great deliverability"}
                {emailSettings.service === "sendgrid" && "Sign up at sendgrid.com - Popular email service"}
                {emailSettings.service === "ses" && "AWS Simple Email Service - Requires API Gateway endpoint"}
                {emailSettings.service === "smtp" && "Custom SMTP server - Requires backend endpoint"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email Address</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This email address will appear as the sender. Must be verified with your email service.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                type="text"
                placeholder="GroupTherapy Records"
                value={emailSettings.senderName}
                onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This name will appear next to the sender email in inboxes.
              </p>
            </div>

            {(emailSettings.service === "resend" || emailSettings.service === "sendgrid") && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={
                    emailServiceSettings?.hasApiKey
                      ? `Saved (ends with ${emailServiceSettings.apiKeyLast4 || "****"}) — enter a new key to replace`
                      : "Enter your API key"
                  }
                  value={emailSettings.apiKey || ""}
                  onChange={(e) => setEmailSettings({ ...emailSettings, apiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is stored locally in this browser. Leave blank to keep the existing key on this device.
                </p>
              </div>
            )}

            {(emailSettings.service === "ses" || emailSettings.service === "smtp") && (
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  type="url"
                  placeholder="https://api.example.com/send-email"
                  value={emailSettings.apiUrl || ""}
                  onChange={(e) => setEmailSettings({ ...emailSettings, apiUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  The endpoint URL for your email service API.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEmailSettings}
              disabled={saveEmailSettingsMutation.isPending}
            >
              {saveEmailSettingsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Compose Newsletter</DialogTitle>
            <DialogDescription>
              Create and send a newsletter to {activeSubscribers.length} active subscribers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isGeminiConfigured() && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Label htmlFor="prompt">
                      <Sparkles className="h-4 w-4 inline mr-1" />
                      Generate with AI
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="prompt"
                        placeholder="E.g., 'Announce our new summer release compilation'"
                        value={emailData.prompt}
                        onChange={(e) =>
                          setEmailData((prev) => ({ ...prev, prompt: e.target.value }))
                        }
                      />
                      <Button
                        onClick={handleGenerateContent}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Newsletter subject"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML supported)</Label>
              <Textarea
                id="content"
                placeholder="Newsletter content..."
                value={emailData.content}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            {emailData.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(emailData.content) }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendNewsletter}
              disabled={sendEmailMutation.isPending || !isConfigured}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Newsletter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
