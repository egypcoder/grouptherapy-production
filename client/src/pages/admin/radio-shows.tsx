
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Radio, Users, Loader2, CloudDownload, ExternalLink, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { AudioUpload } from "@/components/audio-upload";
import { AdminLayout } from "./index";
import { queryClient, queryFunctions } from "@/lib/queryClient";
import { db, RadioShow, RadioSettings, RadioTrack } from "@/lib/database";

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function getShowStatus(show: RadioShow): { status: 'live' | 'scheduled' | 'recorded'; label: string } {
  const now = new Date();
  const currentDay = now.getDay();

  if (show.dayOfWeek !== undefined && show.startTime && show.endTime) {
    const startMins = parseTimeToMinutes(show.startTime);
    const endMins = parseTimeToMinutes(show.endTime);
    const nowMins = now.getHours() * 60 + now.getMinutes();

    let isCurrentlyLive = false;
    if (endMins > startMins) {
      isCurrentlyLive = currentDay === show.dayOfWeek && nowMins >= startMins && nowMins < endMins;
    } else {
      const isShowDay = currentDay === show.dayOfWeek && nowMins >= startMins;
      const isNextDay = currentDay === ((show.dayOfWeek + 1) % 7) && nowMins < endMins;
      isCurrentlyLive = isShowDay || isNextDay;
    }

    if (isCurrentlyLive) {
      return { status: 'live', label: 'Live' };
    }

    const daysUntilShow = (show.dayOfWeek - currentDay + 7) % 7;
    if (daysUntilShow > 0 || (daysUntilShow === 0 && nowMins < startMins)) {
      return { status: 'scheduled', label: 'Scheduled' };
    }
  }

  if (show.recordedUrl) {
    return { status: 'recorded', label: 'Recorded' };
  }

  return { status: 'scheduled', label: 'Scheduled' };
}

function StatusBadge({ show }: { show: RadioShow }) {
  const { status, label } = getShowStatus(show);

  const variants: Record<string, string> = {
    live: 'bg-green-500/10 text-green-600 border-green-500/20',
    scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    recorded: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  return (
    <Badge className={`${variants[status]} text-[10px] px-1.5 py-0`}>
      {status === 'live' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />}
      {label}
    </Badge>
  );
}

export default function AdminRadioShows() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTrackDialogOpen, setIsTrackDialogOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<RadioShow | null>(null);
  const [soundcloudUrl, setSoundcloudUrl] = useState("");
  const [trackSoundcloudUrl, setTrackSoundcloudUrl] = useState("");
  const [isFetchingSoundcloud, setIsFetchingSoundcloud] = useState(false);
  const [isFetchingTrackSoundcloud, setIsFetchingTrackSoundcloud] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    hostName: "",
    description: "",
    hostImageUrl: "",
    coverUrl: "",
    recordedUrl: "",
    dayOfWeek: 1,
    startTime: "00:00",
    endTime: "00:00",
    timezone: "UTC",
  });
  const [trackFormData, setTrackFormData] = useState({
    title: "",
    artist: "",
    album: "",
    coverUrl: "",
    soundcloudUrl: "",
  });

  const { data: shows = [] } = useQuery<RadioShow[]>({
    queryKey: ["radioShows"],
    queryFn: queryFunctions.radioShows,
  });

  const { data: radioSettings } = useQuery<RadioSettings | null>({
    queryKey: ["radioSettings"],
    queryFn: async () => {
      try {
        return await db.radioSettings.get();
      } catch {
        return null;
      }
    },
  });

  const { data: recentTracks = [] } = useQuery<RadioTrack[]>({
    queryKey: ["recentRadioTracks"],
    queryFn: async () => {
      try {
        return await db.radioTracks.getRecent(20);
      } catch {
        return [];
      }
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.radioTracks.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentRadioTracks"] });
      toast({
        title: "Track deleted",
        description: "The track has been removed from recent streams.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete track",
        variant: "destructive",
      });
    },
  });

  const createTrackMutation = useMutation({
    mutationFn: async (track: Partial<RadioTrack>) => {
      return db.radioTracks.create(track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentRadioTracks"] });
      toast({
        title: "Stream added",
        description: "The track has been added to recent streams.",
      });
      setIsTrackDialogOpen(false);
      resetTrackForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add track",
        variant: "destructive",
      });
    },
  });

  const fetchTrackSoundcloudMetadata = async () => {
    if (!trackSoundcloudUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SoundCloud URL",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingTrackSoundcloud(true);
    try {
      const response = await fetch(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(trackSoundcloudUrl)}&format=json`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch SoundCloud metadata");
      }

      const data = await response.json();
      
      const titleMatch = data.title?.match(/^(.+?) by (.+)$/);
      const extractedTitle = titleMatch ? titleMatch[1] : data.title || "";
      const extractedArtist = titleMatch ? titleMatch[2] : data.author_name || "";
      const thumbnailUrl = data.thumbnail_url || "";

      setTrackFormData(prev => ({
        ...prev,
        title: extractedTitle || prev.title,
        artist: extractedArtist || prev.artist,
        coverUrl: thumbnailUrl || prev.coverUrl,
        soundcloudUrl: trackSoundcloudUrl,
      }));

      toast({
        title: "Metadata fetched",
        description: "SoundCloud track info has been auto-filled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch SoundCloud metadata. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingTrackSoundcloud(false);
    }
  };

  const resetTrackForm = () => {
    setTrackSoundcloudUrl("");
    setTrackFormData({
      title: "",
      artist: "",
      album: "",
      coverUrl: "",
      soundcloudUrl: "",
    });
  };

  const handleSaveTrack = () => {
    if (!trackFormData.title || !trackFormData.artist) {
      toast({
        title: "Error",
        description: "Please fill in title and artist",
        variant: "destructive",
      });
      return;
    }
    createTrackMutation.mutate({
      title: trackFormData.title,
      artist: trackFormData.artist,
      album: trackFormData.album || undefined,
      coverUrl: trackFormData.coverUrl || undefined,
      soundcloudUrl: trackFormData.soundcloudUrl || undefined,
      playedAt: new Date().toISOString(),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return db.radioShows.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radioShows"] });
      toast({
        title: "Show deleted",
        description: "The radio show has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete show",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { isEdit: boolean; id?: string; show: Partial<RadioShow> }) => {
      if (data.isEdit && data.id) {
        return db.radioShows.update(data.id, data.show);
      } else {
        return db.radioShows.create(data.show);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["radioShows"] });
      toast({
        title: variables.isEdit ? "Show updated" : "Show created",
        description: variables.isEdit ? "The radio show has been updated." : "The radio show has been created.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save show",
        variant: "destructive",
      });
    },
  });

  const fetchSoundcloudMetadata = async () => {
    if (!soundcloudUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SoundCloud URL",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingSoundcloud(true);
    try {
      const response = await fetch(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(soundcloudUrl)}&format=json`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch SoundCloud metadata");
      }

      const data = await response.json();
      
      const titleMatch = data.title?.match(/^(.+?) by (.+)$/);
      const extractedTitle = titleMatch ? titleMatch[1] : data.title || "";
      const extractedArtist = titleMatch ? titleMatch[2] : data.author_name || "";
      
      const thumbnailUrl = data.thumbnail_url || "";

      setFormData(prev => ({
        ...prev,
        title: extractedTitle || prev.title,
        hostName: extractedArtist || prev.hostName,
        description: data.description || prev.description,
        coverUrl: thumbnailUrl || prev.coverUrl,
        hostImageUrl: thumbnailUrl || prev.hostImageUrl,
      }));

      toast({
        title: "Metadata fetched",
        description: "SoundCloud track info has been auto-filled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch SoundCloud metadata. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingSoundcloud(false);
    }
  };

  const handleEdit = (show: RadioShow) => {
    setEditingShow(show);
    setSoundcloudUrl("");
    setFormData({
      title: show.title || "",
      hostName: show.hostName || "",
      description: show.description || "",
      hostImageUrl: show.hostImageUrl || "",
      coverUrl: show.coverUrl || "",
      recordedUrl: show.recordedUrl || "",
      dayOfWeek: show.dayOfWeek || 1,
      startTime: show.startTime || "00:00",
      endTime: show.endTime || "00:00",
      timezone: show.timezone || "UTC",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this show?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const showData: Partial<RadioShow> = {
      title: formData.title,
      slug,
      hostName: formData.hostName,
      description: formData.description,
      hostImageUrl: formData.hostImageUrl,
      coverUrl: formData.coverUrl,
      recordedUrl: formData.recordedUrl,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      timezone: formData.timezone,
      isLive: editingShow?.isLive ?? false,
      published: editingShow?.published ?? true,
    };
    
    saveMutation.mutate({
      isEdit: !!editingShow,
      id: editingShow?.id,
      show: showData,
    });
  };

  const resetForm = () => {
    setEditingShow(null);
    setSoundcloudUrl("");
    setFormData({
      title: "",
      hostName: "",
      description: "",
      hostImageUrl: "",
      coverUrl: "",
      recordedUrl: "",
      dayOfWeek: 1,
      startTime: "00:00",
      endTime: "00:00",
      timezone: "UTC",
    });
  };

  const handleOpenNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const listenerCount = radioSettings?.listenerCount;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Radio Shows</h1>
            <p className="text-sm text-muted-foreground">Manage radio show schedule</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              <Users className="h-3.5 w-3.5" />
              <span>{listenerCount !== undefined ? listenerCount : '-'}</span>
              <span className="text-xs">listeners</span>
            </div>
            <Button size="sm" onClick={handleOpenNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Show
            </Button>
          </div>
        </div>

        <Tabs defaultValue="shows" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="shows">Shows</TabsTrigger>
            <TabsTrigger value="recent">Recent Streams</TabsTrigger>
          </TabsList>

          <TabsContent value="shows" className="space-y-2">
            <div className="grid gap-2">
              {shows.map((show) => (
                <Card 
                  key={show.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleEdit(show)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full overflow-hidden flex-shrink-0">
                        {show.hostImageUrl ? (
                          <img src={show.hostImageUrl} alt={show.hostName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Radio className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm truncate">{show.title}</h3>
                          <StatusBadge show={show} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {show.hostName} • {daysOfWeek.find(d => d.value === show.dayOfWeek)?.label} {show.startTime}-{show.endTime}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={(e) => { e.stopPropagation(); handleEdit(show); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={(e) => handleDelete(show.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-2">
            <div className="flex justify-end mb-2">
              <Button size="sm" onClick={() => { resetTrackForm(); setIsTrackDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Stream
              </Button>
            </div>
            {recentTracks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent streams found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2">
                {recentTracks.map((track) => (
                  <Card 
                    key={track.id} 
                    className={track.soundcloudUrl ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                    onClick={() => {
                      if (track.soundcloudUrl) {
                        window.open(track.soundcloudUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                          {track.coverUrl ? (
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">{track.title}</h3>
                            {track.soundcloudUrl && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-500 border-orange-500/20">
                                <ExternalLink className="h-2.5 w-2.5 mr-1" />
                                SoundCloud
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {track.artist} {track.album ? `• ${track.album}` : ''} • {new Date(track.playedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this track?")) {
                                deleteTrackMutation.mutate(track.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingShow ? "Edit Show" : "Add New Show"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CloudDownload className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-medium">Import from SoundCloud</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste SoundCloud track URL..."
                    value={soundcloudUrl}
                    onChange={(e) => setSoundcloudUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={fetchSoundcloudMetadata}
                    disabled={isFetchingSoundcloud}
                  >
                    {isFetchingSoundcloud ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Fetch"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-fill title, artist, and artwork from a SoundCloud URL
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Show Information</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Show Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter show title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostName">Host Name</Label>
                    <Input
                      id="hostName"
                      placeholder="Enter host name"
                      value={formData.hostName}
                      onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      placeholder="Describe the show..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Images</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Host Image</Label>
                    <ImageUpload
                      currentImage={formData.hostImageUrl}
                      onUploadComplete={(url) => setFormData({ ...formData, hostImageUrl: url })}
                      bucket="media"
                      folder="hosts"
                      aspectRatio="square"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Show Cover Image</Label>
                    <ImageUpload
                      currentImage={formData.coverUrl}
                      onUploadComplete={(url) => setFormData({ ...formData, coverUrl: url })}
                      bucket="media"
                      folder="shows"
                      aspectRatio="square"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Audio</h3>
                <div className="space-y-2">
                  <Label>Recorded Episode</Label>
                  <AudioUpload
                    currentAudio={formData.recordedUrl}
                    onUploadComplete={(url) => setFormData({ ...formData, recordedUrl: url })}
                    bucket="media"
                    folder="radio-recordings"
                  />
                  {formData.recordedUrl && (
                    <p className="text-xs text-muted-foreground truncate">
                      Current: {formData.recordedUrl}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Schedule</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <Select 
                      value={formData.dayOfWeek.toString()} 
                      onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      placeholder="e.g., UTC, America/New_York"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Show"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isTrackDialogOpen} onOpenChange={setIsTrackDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Recent Stream</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CloudDownload className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-medium">Import from SoundCloud</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste SoundCloud URL..."
                    value={trackSoundcloudUrl}
                    onChange={(e) => setTrackSoundcloudUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={fetchTrackSoundcloudMetadata}
                    disabled={isFetchingTrackSoundcloud}
                  >
                    {isFetchingTrackSoundcloud ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="trackTitle">Title *</Label>
                  <Input
                    id="trackTitle"
                    placeholder="Track title"
                    value={trackFormData.title}
                    onChange={(e) => setTrackFormData({ ...trackFormData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackArtist">Artist *</Label>
                  <Input
                    id="trackArtist"
                    placeholder="Artist name"
                    value={trackFormData.artist}
                    onChange={(e) => setTrackFormData({ ...trackFormData, artist: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackAlbum">Album</Label>
                  <Input
                    id="trackAlbum"
                    placeholder="Album name (optional)"
                    value={trackFormData.album}
                    onChange={(e) => setTrackFormData({ ...trackFormData, album: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackCover">Cover URL</Label>
                  <Input
                    id="trackCover"
                    placeholder="Cover image URL (optional)"
                    value={trackFormData.coverUrl}
                    onChange={(e) => setTrackFormData({ ...trackFormData, coverUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsTrackDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTrack} disabled={createTrackMutation.isPending}>
                  {createTrackMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Stream"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
