import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "./index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/image-upload";
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
import { db, Release } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

interface ReleaseFormData {
  title: string;
  artistName: string;
  coverUrl: string;
  releaseDate: string;
  type: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  soundcloudUrl: string;
  featured: boolean;
  published: boolean;
}

const defaultFormData: ReleaseFormData = {
  title: "",
  artistName: "",
  coverUrl: "",
  releaseDate: "",
  type: "single",
  spotifyUrl: "",
  appleMusicUrl: "",
  soundcloudUrl: "",
  featured: false,
  published: false,
};

export default function AdminReleases() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [matchNew] = useRoute("/admin/releases/new");
  const [matchEdit, params] = useRoute("/admin/releases/:id");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [formData, setFormData] = useState<ReleaseFormData>(defaultFormData);

  const { data: releases } = useQuery<Release[]>({
    queryKey: ["releases"],
    queryFn: queryFunctions.releases,
  });

  const displayReleases = releases || [];

  useEffect(() => {
    if (matchNew) {
      setEditingRelease(null);
      setFormData(defaultFormData);
      setIsDialogOpen(true);
    } else if (matchEdit && params?.id && params.id !== "new") {
      const release = displayReleases.find(r => r.id === params.id);
      if (release) {
        handleEdit(release);
      } else if (displayReleases.length > 0) {
        db.releases.getById(params.id).then(release => {
          if (release) {
            handleEdit(release);
          }
        });
      }
    }
  }, [matchNew, matchEdit, params?.id, displayReleases.length]);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRelease(null);
    setFormData(defaultFormData);
    setLocation("/admin/releases");
  };

  const handleEdit = (release: Release) => {
    setEditingRelease(release);
    setFormData({
      title: release.title || "",
      artistName: release.artistName || "",
      coverUrl: release.coverUrl || "",
      releaseDate: release.releaseDate ? new Date(release.releaseDate).toISOString().slice(0, 10) : "",
      type: release.type || "single",
      spotifyUrl: release.spotifyUrl || "",
      appleMusicUrl: release.appleMusicUrl || "",
      soundcloudUrl: release.soundcloudUrl || "",
      featured: release.featured || false,
      published: release.published || false,
    });
    setIsDialogOpen(true);
  };

  const filteredReleases = displayReleases.filter((release) => {
    const matchesSearch =
      release.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      release.artistName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || release.type === filterType;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && release.published) ||
      (filterStatus === "draft" && !release.published);
    return matchesSearch && matchesType && matchesStatus;
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      return db.releases.update(id, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      toast({ title: "Release updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.releases.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      toast({ title: "Release deleted" });
      setDeleteId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; release: Partial<Release> }) => {
      if (data.isEdit && data.id) {
        return db.releases.update(data.id, data.release);
      } else {
        return db.releases.create(data.release);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      toast({
        title: variables.isEdit ? "Release updated" : "Release created",
        description: variables.isEdit ? "The release has been updated." : "The release has been created.",
      });
      handleDialogClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save release",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title || !formData.artistName) {
      toast({
        title: "Missing fields",
        description: "Please fill in required fields: title and artist name.",
        variant: "destructive",
      });
      return;
    }

    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const releaseData: Partial<Release> = {
      title: formData.title,
      slug,
      artistName: formData.artistName,
      coverUrl: formData.coverUrl || undefined,
      releaseDate: formData.releaseDate ? new Date(formData.releaseDate).toISOString() : undefined,
      type: formData.type,
      spotifyUrl: formData.spotifyUrl || undefined,
      appleMusicUrl: formData.appleMusicUrl || undefined,
      soundcloudUrl: formData.soundcloudUrl || undefined,
      featured: formData.featured,
      published: formData.published,
    };
    
    saveMutation.mutate({
      isEdit: !!editingRelease,
      id: editingRelease?.id,
      release: releaseData,
    });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-releases-title">Releases</h1>
            <p className="text-muted-foreground">
              Manage your music catalog
            </p>
          </div>
          <Button 
            className="gap-2" 
            data-testid="button-new-release"
            onClick={() => setLocation("/admin/releases/new")}
          >
            <Plus className="h-4 w-4" />
            Add Release
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-search-releases"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]" data-testid="select-filter-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="album">Album</SelectItem>
                  <SelectItem value="ep">EP</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
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
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReleases.map((release) => (
                  <TableRow key={release.id} data-testid={`row-release-${release.id}`}>
                    <TableCell>
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                        {release.coverUrl ? (
                          <img
                            src={release.coverUrl}
                            alt={release.title}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{release.title}</div>
                      {release.featured && (
                        <Badge variant="default" className="text-xs mt-1">
                          Featured
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{release.artistName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {release.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(release.releaseDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={release.published ? "default" : "secondary"}
                      >
                        {release.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-release-actions-${release.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/admin/releases/${release.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              togglePublishMutation.mutate({
                                id: release.id!,
                                published: !release.published,
                              })
                            }
                          >
                            {release.published ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          {release.spotifyUrl && (
                            <DropdownMenuItem asChild>
                              <a
                                href={release.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View on Spotify
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(release.id!)}
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

            {filteredReleases.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No releases found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Release</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this release? This action cannot be undone.
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRelease ? "Edit Release" : "Create Release"}</DialogTitle>
            <DialogDescription>
              {editingRelease ? "Update the release details below." : "Fill in the details to create a new release."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Release title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="artistName">Artist Name *</Label>
              <Input
                id="artistName"
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                placeholder="Artist name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="ep">EP</SelectItem>
                    <SelectItem value="album">Album</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="releaseDate">Release Date</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Cover Art</Label>
              <ImageUpload
                currentImage={formData.coverUrl}
                onUploadComplete={(url: string) => setFormData({ ...formData, coverUrl: url })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="spotifyUrl">Spotify URL</Label>
              <Input
                id="spotifyUrl"
                type="url"
                value={formData.spotifyUrl}
                onChange={(e) => setFormData({ ...formData, spotifyUrl: e.target.value })}
                placeholder="https://open.spotify.com/..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="appleMusicUrl">Apple Music URL</Label>
              <Input
                id="appleMusicUrl"
                type="url"
                value={formData.appleMusicUrl}
                onChange={(e) => setFormData({ ...formData, appleMusicUrl: e.target.value })}
                placeholder="https://music.apple.com/..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="soundcloudUrl">SoundCloud URL</Label>
              <Input
                id="soundcloudUrl"
                type="url"
                value={formData.soundcloudUrl}
                onChange={(e) => setFormData({ ...formData, soundcloudUrl: e.target.value })}
                placeholder="https://soundcloud.com/..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured release</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingRelease ? "Update Release" : "Create Release"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
