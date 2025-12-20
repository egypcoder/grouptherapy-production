import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Send, Loader2, Trash2, Download, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, NewsletterSubscriber } from "@/lib/database";
import { generateContent, isGeminiConfigured } from "@/lib/gemini";

export default function AdminNewsletters() {
  const { toast } = useToast();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
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

  const activeSubscribers = subscribers.filter((s) => s.active);

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
      // This would integrate with an email service like SendGrid, AWS SES, etc.
      // For now, we'll just simulate the send
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Newsletter Sent!",
        description: `Email sent to ${activeSubscribers.length} subscribers.`,
      });
      setIsComposeOpen(false);
      setEmailData({ subject: "", content: "", prompt: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send newsletter.",
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
        const subjectLine = parts[0].replace("SUBJECT:", "").trim();
        const htmlContent = parts[1].trim();
        
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Newsletter Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage subscribers and send newsletters
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportSubscribers}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsComposeOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Compose Newsletter
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscribers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Badge variant="default">{activeSubscribers.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeSubscribers.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
              <Badge variant="secondary">{subscribers.length - activeSubscribers.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {subscribers.length - activeSubscribers.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscribers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscribers</CardTitle>
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
              disabled={sendEmailMutation.isPending}
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
