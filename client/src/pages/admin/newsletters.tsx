import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Send, Loader2, Trash2, Download, Sparkles, Settings, CheckCircle2, AlertCircle } from "lucide-react";
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
import { db, NewsletterSubscriber, SiteSettings } from "@/lib/database";
import { generateContent, isGeminiConfigured } from "@/lib/gemini";
import { sendEmail, isEmailServiceConfigured, getEmailConfigInstructions, setEmailConfig } from "@/lib/email-service";

interface EmailServiceConfig {
  service: string;
  apiKey?: string;
  apiUrl?: string;
  fromEmail: string;
}

export default function AdminNewsletters() {
  const { toast } = useToast();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: "",
    content: "",
    prompt: "",
  });

  const { data: subscribers = [] } = useQuery<NewsletterSubscriber[]>({
    queryKey: ["newsletterSubscribers"],
    queryFn: queryFunctions.newsletterSubscribers,
  });

  const { data: siteSettings } = useQuery<SiteSettings | null>({
    queryKey: ["siteSettings"],
    queryFn: () => db.siteSettings.get(),
  });

  const activeSubscribers = subscribers.filter((s) => s.active);

  // Parse email service config from site settings
  const emailConfig: EmailServiceConfig = siteSettings?.emailServiceConfig 
    ? (typeof siteSettings.emailServiceConfig === 'string' 
        ? JSON.parse(siteSettings.emailServiceConfig) 
        : siteSettings.emailServiceConfig)
    : { service: "none", fromEmail: "" };

  const [emailSettings, setEmailSettings] = useState<EmailServiceConfig>(emailConfig);

  // Update email service config when settings change
  useEffect(() => {
    if (emailConfig.service && emailConfig.service !== "none") {
      setEmailConfig(emailConfig);
    }
  }, [emailConfig]);

  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (config: EmailServiceConfig) => {
      const updatedSettings: Partial<SiteSettings> = {
        emailServiceConfig: JSON.stringify(config) as any,
      };
      const result = await db.siteSettings.update(updatedSettings);
      // Update the email service with new config
      setEmailConfig(config);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
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

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string; recipients: string[] }) => {
      if (!isEmailServiceConfigured()) {
        throw new Error("Email service is not configured. Please configure it in Settings.");
      }

      if (data.recipients.length === 0) {
        throw new Error("No recipients to send to.");
      }

      const result = await sendEmail({
        to: data.recipients,
        subject: data.subject,
        html: data.content,
        from: emailConfig.fromEmail || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      return result;
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
      const prompt = `Write a professional email newsletter for a music record label called GroupTherapy Records. 
Topic: ${emailData.prompt}

The email should:
- Have an engaging subject line
- Be written in HTML format with inline styles matching a modern music website design
- Use a dark theme with accents of purple/blue (#8B5CF6 for primary color)
- Be mobile-responsive
- Include clear sections and be easy to read
- Be professional but energetic, matching the electronic music industry tone

Format the response as:
SUBJECT: [subject line here]
---
[HTML content here]`;

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

    if ((emailSettings.service === "resend" || emailSettings.service === "sendgrid") && !emailSettings.apiKey) {
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
    ((emailConfig.service === "resend" || emailConfig.service === "sendgrid") ? !!emailConfig.apiKey : true) &&
    ((emailConfig.service === "ses" || emailConfig.service === "smtp") ? !!emailConfig.apiUrl : true) &&
    !!emailConfig.fromEmail;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Newsletter Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage subscribers and send newsletters
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportSubscribers}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Email Settings
            </Button>
            <Button onClick={() => setIsComposeOpen(true)} disabled={!isConfigured}>
              <Mail className="h-4 w-4 mr-2" />
              Compose Newsletter
            </Button>
          </div>
        </div>

        {/* Email Service Status */}
        {!isConfigured && (
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Email service not configured
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Please configure your email service settings to send newsletters.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsSettingsOpen(true)}>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isConfigured && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Email service configured: {emailConfig.service}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                    From: {emailConfig.fromEmail}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setIsSettingsOpen(true)}>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
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

        {/* Subscribers Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Subscribers</CardTitle>
            <CardDescription>Manage your newsletter subscriber list</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium">{subscriber.email}</TableCell>
                    <TableCell>{subscriber.name || "-"}</TableCell>
                    <TableCell>{subscriber.source || "-"}</TableCell>
                    <TableCell>
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

            {subscribers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No subscribers yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            {(emailSettings.service === "resend" || emailSettings.service === "sendgrid") && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  value={emailSettings.apiKey || ""}
                  onChange={(e) => setEmailSettings({ ...emailSettings, apiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key will be stored securely in the database.
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    dangerouslySetInnerHTML={{ __html: emailData.content }}
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
