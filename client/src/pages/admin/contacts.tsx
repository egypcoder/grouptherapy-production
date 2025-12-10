import { useState, useEffect, useCallback } from "react";
import { Search, Mail, Trash2, MoreVertical, CheckCircle, Clock, Archive, Bell, BellOff } from "lucide-react";
import { AdminLayout } from "./index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, Contact } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { requestNotificationPermission, showNotification } from "@/lib/firebase";

export default function AdminContacts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const { data: contacts, refetch } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: queryFunctions.contacts,
  });

  const displayContacts = contacts || [];

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
      if (Notification.permission === 'default') {
        setShowNotificationPrompt(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('contacts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contacts' },
        (payload) => {
          refetch();
          const newContact = payload.new as any;
          
          if (notificationsEnabled) {
            showNotification(
              'New Message Received',
              `${newContact.name}: ${newContact.subject || 'No subject'}`,
              '/favicon.ico'
            );
          }

          toast({
            title: "New Message",
            description: `From ${newContact.name}: ${newContact.subject || 'No subject'}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contacts' },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'contacts' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, notificationsEnabled, toast]);

  const handleEnableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    setShowNotificationPrompt(false);
    
    if (granted) {
      toast({
        title: "Notifications Enabled",
        description: "You'll receive browser notifications for new messages.",
      });
    } else {
      toast({
        title: "Notifications Blocked",
        description: "You can enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const filteredContacts = displayContacts.filter((contact) => {
    const matchesSearch =
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || contact.category === filterCategory;
    const matchesStatus = filterStatus === "all" || contact.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return db.contacts.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.contacts.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Contact deleted" });
      setDeleteId(null);
    },
  });

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4 text-primary" />;
      case "read":
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      case "archived":
        return <Archive className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const newCount = displayContacts.filter((c) => c.status === "new").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-contacts-title">Messages</h1>
            <p className="text-muted-foreground">
              Contact form submissions and inquiries
            </p>
          </div>
          <Button
            variant={notificationsEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleEnableNotifications}
            className="flex items-center gap-2"
          >
            {notificationsEnabled ? (
              <>
                <Bell className="h-4 w-4" />
                Notifications On
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                Enable Notifications
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{displayContacts.length}</div>
              <p className="text-sm text-muted-foreground">Total Messages</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{newCount}</div>
              <p className="text-sm text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {displayContacts.filter((c) => c.category === "demo").length}
              </div>
              <p className="text-sm text-muted-foreground">Demo Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {displayContacts.filter((c) => c.category === "press").length}
              </div>
              <p className="text-sm text-muted-foreground">Press Inquiries</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-search-contacts"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="press">Press</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className={contact.status === "new" ? "bg-primary/5" : ""}
                    data-testid={`row-contact-${contact.id}`}
                  >
                    <TableCell>{getStatusIcon(contact.status || "new")}</TableCell>
                    <TableCell>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-muted-foreground">{contact.email}</div>
                    </TableCell>
                    <TableCell>
                      <button
                        className="text-left hover:text-primary transition-colors"
                        onClick={() => setSelectedContact(contact as Contact)}
                      >
                        {contact.subject}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {contact.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(contact.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedContact(contact as Contact)}>
                            <Mail className="h-4 w-4 mr-2" />
                            View Message
                          </DropdownMenuItem>
                          {contact.status !== "read" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatusMutation.mutate({ id: contact.id!, status: "read" })
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({ id: contact.id!, status: "archived" })
                            }
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(contact.id!)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredContacts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No messages found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContact?.subject}</DialogTitle>
            <DialogDescription>
              From {selectedContact?.name} ({selectedContact?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline" className="capitalize">
                {selectedContact?.category}
              </Badge>
              <span>{formatDate(selectedContact?.createdAt)}</span>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <p className="whitespace-pre-wrap">{selectedContact?.message}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedContact(null)}>
              Close
            </Button>
            <Button asChild>
              <a href={`mailto:${selectedContact?.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                Reply
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotificationPrompt} onOpenChange={setShowNotificationPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Enable Notifications
            </DialogTitle>
            <DialogDescription>
              Get notified when new messages arrive, even when you're not on this page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Browser notifications help you respond to inquiries faster and never miss an important message.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowNotificationPrompt(false)}>
              Not Now
            </Button>
            <Button onClick={handleEnableNotifications}>
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
