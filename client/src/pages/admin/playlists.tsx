import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ListMusic, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, Playlist } from "@/lib/database";

function extractSpotifyPlaylistId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /spotify:playlist:([a-zA-Z0-9]+)/,
    /^([a-zA-Z0-9]{22})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('Spotify credentials not configured');
    return null;
  }
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    return null;
  }
}

interface SpotifyPlaylistMetadata {
  name: string;
  description: string;
  coverUrl: string;
  trackCount: number;
  spotifyUrl: string;
}

async function fetchSpotifyPlaylistMetadata(playlistId: string): Promise<SpotifyPlaylistMetadata | null> {
  const accessToken = await getSpotifyAccessToken();
  
  if (!accessToken) {
    throw new Error('Could not authenticate with Spotify. Check your credentials.');
  }
  
  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Playlist not found. Make sure the playlist is public.');
      }
      throw new Error(`Failed to fetch playlist: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      name: data.name || '',
      description: data.description?.replace(/<[^>]*>/g, '') || '',
      coverUrl: data.images?.[0]?.url || '',
      trackCount: data.tracks?.total || 0,
      spotifyUrl: data.external_urls?.spotify || '',
    };
  } catch (error) {
    console.error('Error fetching Spotify playlist:', error);
    throw error;
  }
}

export default function AdminPlaylists() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadataFetched, setMetadataFetched] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverUrl: "",
    spotifyUrl: "",
    spotifyPlaylistId: "",
    featured: false,
    trackCount: 0,
  });

  const { data: playlists = [] } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: queryFunctions.playlists,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.playlists.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast({
        title: "Playlist deleted",
        description: "The playlist has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete playlist",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; playlist: Partial<Playlist> }) => {
      if (data.isEdit && data.id) {
        return db.playlists.update(data.id, data.playlist);
      } else {
        return db.playlists.create(data.playlist);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast({
        title: variables.isEdit ? "Playlist updated" : "Playlist created",
        description: variables.isEdit ? "The playlist has been updated." : "The playlist has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save playlist",
        variant: "destructive",
      });
    },
  });

  const handleSpotifyUrlChange = async (url: string) => {
    setFormData(prev => ({ ...prev, spotifyUrl: url }));
    
    const playlistId = extractSpotifyPlaylistId(url);
    if (playlistId) {
      setFormData(prev => ({ ...prev, spotifyPlaylistId: playlistId }));
      
      setIsFetchingMetadata(true);
      try {
        const metadata = await fetchSpotifyPlaylistMetadata(playlistId);
        
        if (metadata) {
          setFormData(prev => ({
            ...prev,
            title: metadata.name || prev.title,
            description: metadata.description || prev.description,
            coverUrl: metadata.coverUrl || prev.coverUrl,
            spotifyUrl: metadata.spotifyUrl || prev.spotifyUrl,
            trackCount: metadata.trackCount,
          }));
          setMetadataFetched(true);
          
          toast({
            title: "Metadata fetched",
            description: `Found "${metadata.name}" with ${metadata.trackCount} tracks.`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch playlist metadata",
          variant: "destructive",
        });
      } finally {
        setIsFetchingMetadata(false);
      }
    }
  };

  const handleFetchMetadata = async () => {
    if (!formData.spotifyPlaylistId) {
      toast({
        title: "No playlist ID",
        description: "Please enter a valid Spotify URL or playlist ID first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetchingMetadata(true);
    
    try {
      const metadata = await fetchSpotifyPlaylistMetadata(formData.spotifyPlaylistId);
      
      if (metadata) {
        setFormData(prev => ({
          ...prev,
          title: metadata.name || prev.title,
          description: metadata.description || prev.description,
          coverUrl: metadata.coverUrl || prev.coverUrl,
          spotifyUrl: metadata.spotifyUrl || prev.spotifyUrl,
          trackCount: metadata.trackCount,
        }));
        setMetadataFetched(true);
        
        toast({
          title: "Metadata fetched",
          description: `Found "${metadata.name}" with ${metadata.trackCount} tracks.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch playlist metadata",
        variant: "destructive",
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      title: playlist.title || "",
      description: playlist.description || "",
      coverUrl: playlist.coverUrl || "",
      spotifyUrl: playlist.spotifyUrl || "",
      spotifyPlaylistId: playlist.spotifyPlaylistId || "",
      featured: playlist.featured || false,
      trackCount: playlist.trackCount || 0,
    });
    setMetadataFetched(!!playlist.spotifyPlaylistId);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const playlistData: Partial<Playlist> = {
      title: formData.title,
      slug,
      description: formData.description,
      coverUrl: formData.coverUrl,
      spotifyUrl: formData.spotifyUrl,
      spotifyPlaylistId: formData.spotifyPlaylistId,
      featured: formData.featured,
      published: editingPlaylist?.published ?? true,
      trackCount: formData.trackCount,
    };
    
    saveMutation.mutate({
      isEdit: !!editingPlaylist,
      id: editingPlaylist?.id,
      playlist: playlistData,
    });
  };

  const resetForm = () => {
    setEditingPlaylist(null);
    setMetadataFetched(false);
    setFormData({
      title: "",
      description: "",
      coverUrl: "",
      spotifyUrl: "",
      spotifyPlaylistId: "",
      featured: false,
      trackCount: 0,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="text-muted-foreground">Manage curated playlists</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Playlist
          </Button>
        </div>

        <div className="grid gap-4">
          {playlists.map((playlist) => (
            <Card key={playlist.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                    {playlist.coverUrl ? (
                      <img src={playlist.coverUrl} alt={playlist.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ListMusic className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{playlist.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{playlist.description}</p>
                    {playlist.trackCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{playlist.trackCount} tracks</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(playlist)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(playlist.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>{editingPlaylist ? "Edit Playlist" : "Add New Playlist"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="spotifyUrl">Spotify URL</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="spotifyUrl"
                    value={formData.spotifyUrl}
                    onChange={(e) => handleSpotifyUrlChange(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={handleFetchMetadata}
                    disabled={isFetchingMetadata || !formData.spotifyPlaylistId}
                  >
                    {isFetchingMetadata ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Fetch Metadata"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste a Spotify playlist URL to auto-extract the ID and fetch metadata
                </p>
              </div>
              <div>
                <Label htmlFor="spotifyPlaylistId">Spotify Playlist ID</Label>
                <Input
                  id="spotifyPlaylistId"
                  value={formData.spotifyPlaylistId}
                  onChange={(e) => setFormData({ ...formData, spotifyPlaylistId: e.target.value })}
                  placeholder="37i9dQZF1DXcBWIGoYBM5M"
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={metadataFetched}
                />
                {metadataFetched && (
                  <p className="text-xs text-muted-foreground mt-1">Auto-filled from Spotify</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={metadataFetched}
                />
                {metadataFetched && (
                  <p className="text-xs text-muted-foreground mt-1">Auto-filled from Spotify</p>
                )}
              </div>
              <div>
                <Label>Playlist Cover</Label>
                {metadataFetched && formData.coverUrl ? (
                  <div className="mt-2">
                    <img 
                      src={formData.coverUrl} 
                      alt="Playlist cover" 
                      className="w-32 h-32 object-cover rounded"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-filled from Spotify</p>
                  </div>
                ) : (
                  <ImageUpload
                    onUploadComplete={(url) => setFormData({ ...formData, coverUrl: url })}
                    bucket="media"
                    folder="playlists"
                    aspectRatio="square"
                    currentImage={formData.coverUrl}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="trackCount">Track Count</Label>
                <Input
                  id="trackCount"
                  type="number"
                  value={formData.trackCount}
                  onChange={(e) => setFormData({ ...formData, trackCount: parseInt(e.target.value) || 0 })}
                  disabled={metadataFetched}
                />
                {metadataFetched && (
                  <p className="text-xs text-muted-foreground mt-1">Auto-filled from Spotify</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured</Label>
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
