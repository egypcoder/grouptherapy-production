import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  FileText,
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "./index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { db, Post } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";

interface PostFormData {
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  category: string;
  authorName: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  featured: boolean;
  published: boolean;
}

const defaultFormData: PostFormData = {
  title: "",
  excerpt: "",
  content: "",
  coverUrl: "",
  category: "news",
  authorName: "",
  tags: "",
  metaTitle: "",
  metaDescription: "",
  featured: false,
  published: false,
};

export default function AdminPosts() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [matchNew] = useRoute("/admin/posts/new");
  const [matchEdit, params] = useRoute("/admin/posts/:id");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<PostFormData>(defaultFormData);

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: queryFunctions.posts,
  });

  const displayPosts = posts || [];

  useEffect(() => {
    if (matchNew) {
      setEditingPost(null);
      setFormData(defaultFormData);
      setIsDialogOpen(true);
    } else if (matchEdit && params?.id && params.id !== "new") {
      const post = displayPosts.find(p => p.id === params.id);
      if (post) {
        handleEdit(post);
      } else if (displayPosts.length > 0) {
        db.posts.getById(params.id).then(post => {
          if (post) {
            handleEdit(post);
          }
        });
      }
    }
  }, [matchNew, matchEdit, params?.id, displayPosts.length]);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    setFormData(defaultFormData);
    setLocation("/admin/posts");
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      coverUrl: post.coverUrl || "",
      category: post.category || "news",
      authorName: post.authorName || "",
      tags: post.tags?.join(", ") || "",
      metaTitle: post.metaTitle || "",
      metaDescription: post.metaDescription || "",
      featured: post.featured || false,
      published: post.published || false,
    });
    setIsDialogOpen(true);
  };

  const filteredPosts = displayPosts.filter((post) => {
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || post.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && post.published) ||
      (filterStatus === "draft" && !post.published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      return db.posts.update(id, { published, publishedAt: published ? new Date().toISOString() : undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Post updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.posts.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Post deleted" });
      setDeleteId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; post: Partial<Post> }) => {
      if (data.isEdit && data.id) {
        return db.posts.update(data.id, data.post);
      } else {
        return db.posts.create(data.post);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: variables.isEdit ? "Post updated" : "Post created",
        description: variables.isEdit ? "The post has been updated." : "The post has been created.",
      });
      handleDialogClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title) {
      toast({
        title: "Missing fields",
        description: "Please provide a title for the post.",
        variant: "destructive",
      });
      return;
    }

    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const postData: Partial<Post> = {
      title: formData.title,
      slug,
      excerpt: formData.excerpt || undefined,
      content: formData.content || undefined,
      coverUrl: formData.coverUrl || undefined,
      category: formData.category,
      authorName: formData.authorName || undefined,
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      metaTitle: formData.metaTitle || undefined,
      metaDescription: formData.metaDescription || undefined,
      featured: formData.featured,
      published: formData.published,
      publishedAt: formData.published ? new Date().toISOString() : undefined,
    };
    
    saveMutation.mutate({
      isEdit: !!editingPost,
      id: editingPost?.id,
      post: postData,
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
            <h1 className="text-3xl font-bold" data-testid="text-admin-posts-title">Blog / News</h1>
            <p className="text-muted-foreground">
              Manage articles and news posts
            </p>
          </div>
          <Button 
            className="gap-2" 
            data-testid="button-new-post"
            onClick={() => setLocation("/admin/posts/new")}
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-search-posts"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="releases">Releases</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                  <SelectItem value="features">Features</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
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
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id} data-testid={`row-post-${post.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {post.coverUrl ? (
                            <img src={post.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium line-clamp-1">{post.title}</div>
                          {post.featured && (
                            <Badge variant="default" className="text-xs mt-1">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {post.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.authorName || "-"}</TableCell>
                    <TableCell>{formatDate(post.publishedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/admin/posts/${post.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              togglePublishMutation.mutate({
                                id: post.id!,
                                published: !post.published,
                              })
                            }
                          >
                            {post.published ? (
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(post.id!)}
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

            {filteredPosts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No posts found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create Post"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Update the post details below." : "Fill in the details to create a new post."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Post title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the post"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Full post content"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="releases">Releases</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="interviews">Interviews</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="authorName">Author Name</Label>
                <Input
                  id="authorName"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="Author name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., music, electronic, festival"
              />
            </div>

            <div className="grid gap-2">
              <Label>Cover Image</Label>
              <ImageUpload
                currentImage={formData.coverUrl}
                onUploadComplete={(url: string) => setFormData({ ...formData, coverUrl: url })}
                aspectRatio="video"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="SEO title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <Input
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="SEO description"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured post</Label>
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
              {saveMutation.isPending ? "Saving..." : editingPost ? "Update Post" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
