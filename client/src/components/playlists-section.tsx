import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Music2, ListMusic } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SiSpotify } from "react-icons/si";
import { SpotifyEmbed } from "@/components/playlist-player";
import type { Playlist } from "@shared/schema";

interface PlaylistsSectionProps {
  playlists?: Playlist[];
  title?: string;
}

const demoPlaylists: Partial<Playlist>[] = [
  {
    id: "1",
    title: "GroupTherapy Essentials",
    description: "The best tracks from our roster",
    coverUrl: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=400&h=400&fit=crop",
    trackCount: 50,
    spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    featured: true,
  },
  {
    id: "2",
    title: "Late Night Sessions",
    description: "Deep cuts for the after hours",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    trackCount: 35,
    spotifyPlaylistId: "37i9dQZF1DX6VDO8a6cQME",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX6VDO8a6cQME",
  },
  {
    id: "3",
    title: "Peak Time Energy",
    description: "High-energy tracks for the main room",
    coverUrl: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop",
    trackCount: 42,
    spotifyPlaylistId: "37i9dQZF1DX0hvUZG3c29E",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX0hvUZG3c29E",
  },
  {
    id: "4",
    title: "Chill Therapy",
    description: "Ambient and downtempo selections",
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    trackCount: 28,
    spotifyPlaylistId: "37i9dQZF1DX4WYpdgoIcn6",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6",
  },
];

function extractSpotifyId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function PlaylistsSection({
  playlists = [],
  title = "",
}: PlaylistsSectionProps) {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Partial<Playlist> | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const displayPlaylists = playlists.length > 0 ? playlists : demoPlaylists;

  const handlePlayPlaylist = (playlist: Partial<Playlist>) => {
    setSelectedPlaylist(playlist);
    setIsPlayerOpen(true);
  };

  const getSpotifyEmbedId = (playlist: Partial<Playlist>): string | null => {
    return playlist.spotifyPlaylistId ?? extractSpotifyId(playlist.spotifyUrl || "") ?? null;
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {displayPlaylists.slice(0, 4).map((playlist, index) => (
          <motion.div
            key={playlist.id || index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <PlaylistCard 
              playlist={playlist as Playlist} 
              onPlay={() => handlePlayPlaylist(playlist)}
            />
          </motion.div>
        ))}
      </div>

      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border/50 rounded-2xl">
          {selectedPlaylist && (
            <>
              <div className="p-6 border-b border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {selectedPlaylist.coverUrl ? (
                      <img
                        src={selectedPlaylist.coverUrl}
                        alt={selectedPlaylist.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-muted">
                        <Music2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-1">{selectedPlaylist.title}</h2>
                    <p className="text-sm text-muted-foreground mb-2">{selectedPlaylist.description}</p>
                    {selectedPlaylist.trackCount && selectedPlaylist.trackCount > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ListMusic className="h-3 w-3" />
                        {selectedPlaylist.trackCount} tracks
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                {getSpotifyEmbedId(selectedPlaylist) ? (
                  <SpotifyEmbed playlistId={getSpotifyEmbedId(selectedPlaylist)!} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Music2 className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No playable content available.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlaylistCard({ playlist, onPlay }: { playlist: Playlist; onPlay: () => void }) {
  const hasSpotifyEmbed = playlist.spotifyPlaylistId || extractSpotifyId(playlist.spotifyUrl || "");

  return (
    <div 
      className="group cursor-pointer" 
      data-testid={`card-playlist-${playlist.id}`}
      onClick={onPlay}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
        {playlist.coverUrl ? (
          <img
            src={playlist.coverUrl}
            alt={playlist.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90"
          >
            <Play className="h-5 w-5 ml-0.5" />
          </Button>
        </div>

        {hasSpotifyEmbed && (
          <div className="absolute bottom-3 right-3">
            <SiSpotify className="h-5 w-5 text-[#1DB954]" />
          </div>
        )}
      </div>

      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors" data-testid={`text-playlist-title-${playlist.id}`}>
        {playlist.title}
      </h3>
      <p className="text-xs text-muted-foreground truncate" data-testid={`text-playlist-desc-${playlist.id}`}>
        {playlist.trackCount} tracks
      </p>
    </div>
  );
}
