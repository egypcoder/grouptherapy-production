import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { subscribeToChat, sendChatMessage, ChatMessage } from "@/lib/firebase";

const chatColors = [
  {
    text: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  { text: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { text: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  {
    text: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    text: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    text: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  { text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  {
    text: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  { text: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20" },
];

function getUserColor(username: string): {
  text: string;
  bg: string;
  border: string;
} {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % chatColors.length;
  return (
    chatColors[index] ?? {
      text: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    }
  );
}

export function RadioChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username] = useState(`Listener${Math.floor(Math.random() * 1000)}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const checkIfAtBottom = () => {
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollViewport) {
      const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
      const threshold = 70;
      isAtBottomRef.current =
        scrollHeight - scrollTop - clientHeight < threshold;
    }
  };

  const scrollToBottom = (smooth: boolean = true) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "nearest",
        });
      }
    }, 50);
  };

  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollViewport) {
      const handleScroll = () => checkIfAtBottom();
      scrollViewport.addEventListener("scroll", handleScroll);
      return () => scrollViewport.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToChat((newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    await sendChatMessage(username, inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border">
      <CardHeader className="pb-3 flex-shrink-0 border-b border-border bg-card">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MessageCircle className="h-5 w-5 text-primary" />
          Live Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            <AnimatePresence>
              {messages.map((msg) => {
                const userColor = getUserColor(msg.username || "User");
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.isSystem && "justify-center",
                    )}
                  >
                    {!msg.isSystem && (
                      <Avatar
                        className={cn(
                          "h-8 w-8 flex-shrink-0",
                          userColor.border,
                          "border",
                        )}
                      >
                        <AvatarFallback
                          className={cn(
                            userColor.bg,
                            userColor.text,
                            "font-medium",
                          )}
                        >
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "flex-1 min-w-0",
                        msg.isSystem && "text-center",
                      )}
                    >
                      {!msg.isSystem && (
                        <p
                          className={cn(
                            "text-xs font-semibold mb-1",
                            userColor.text,
                          )}
                        >
                          {msg.username}
                        </p>
                      )}
                      <p
                        className={cn(
                          "text-sm rounded-lg px-3 py-2 break-words",
                          msg.isSystem
                            ? "bg-muted text-muted-foreground italic inline-block"
                            : "bg-muted/50 text-foreground",
                        )}
                      >
                        {msg.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 bg-card border-t border-border">
          <Input
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
