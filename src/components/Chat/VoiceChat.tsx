import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X, MessageCircle, Volume2, VolumeX, Loader2, Users, Wifi, LogIn, ImagePlus, Camera, MoreVertical, Reply, Trash2, Copy, CornerDownRight, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'system' | 'other';
  timestamp: Date;
  username?: string;
  imageUrl?: string;
  userId?: string;
  replyTo?: { id: string; username: string; content: string };
}

interface VoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthRequired?: () => void;
}

// Message expiration time (1 hour in milliseconds)
const MESSAGE_EXPIRY_MS = 60 * 60 * 1000;

const VoiceChat = ({ isOpen, onClose, onAuthRequired }: VoiceChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Welcome to TerraPulse Global Chat! Sign in to participate in discussions. Messages auto-delete after 1 hour.',
      sender: 'system',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; username?: string } | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0]
        });
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0]
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Filter out expired messages
  const filterExpiredMessages = useCallback((msgs: Message[]) => {
    const now = new Date().getTime();
    return msgs.filter(msg => {
      if (msg.id === 'welcome') return true;
      const msgTime = msg.timestamp.getTime();
      return now - msgTime < MESSAGE_EXPIRY_MS;
    });
  }, []);

  // Fetch existing messages and setup realtime subscription
  useEffect(() => {
    if (!isOpen) return;

    const fetchMessages = async () => {
      // Calculate cutoff time (1 hour ago)
      const cutoffTime = new Date(Date.now() - MESSAGE_EXPIRY_MS).toISOString();
      
      const { data, error } = await supabase
        .from('chat_messages_public')
        .select('*')
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      if (data && data.length > 0) {
        const formattedMessages: Message[] = data.map(msg => ({
          id: msg.id || crypto.randomUUID(),
          content: msg.content || '',
          sender: 'other' as const,
          timestamp: new Date(msg.created_at || new Date()),
          username: msg.username || 'Anonymous',
          imageUrl: (msg as any).image_url || undefined,
          userId: (msg as any).user_id || undefined,
        }));
        setMessages(prev => [prev[0], ...formattedMessages]);
      }
    };

    fetchMessages();

    // Setup realtime subscription for new messages
    channelRef.current = supabase
      .channel('chat-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as { id: string; content: string; username: string; created_at: string; user_id: string; image_url?: string };

          // Skip if this is our own message (already shown via optimistic update)
          if (newMsg.user_id === currentUser?.id) return;

          const message: Message = {
            id: newMsg.id,
            content: newMsg.content,
            sender: 'other',
            timestamp: new Date(newMsg.created_at),
            username: newMsg.username,
            imageUrl: newMsg.image_url || undefined,
            userId: newMsg.user_id,
          };
          setMessages(prev => [...prev, message]);

          // Speak incoming message if voice is enabled
          if (isVoiceEnabled && newMsg.content && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`${newMsg.username} says: ${newMsg.content}`);
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Setup presence channel for online users
    const username = currentUser?.username || 'Anonymous';
    presenceChannelRef.current = supabase
      .channel('chat-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannelRef.current?.presenceState() || {};
        const users = Object.values(state).flat().map((p: any) => p.username);
        setOnlineUsers([...new Set(users)]);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        toast.info(`${newPresences[0]?.username || 'Someone'} joined the chat`);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        toast.info(`${leftPresences[0]?.username || 'Someone'} left the chat`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isAuthenticated) {
          await presenceChannelRef.current?.track({
            username,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Auto-cleanup expired messages every minute
    const cleanupInterval = setInterval(() => {
      setMessages(prev => filterExpiredMessages(prev));
    }, 60000);

    return () => {
      clearInterval(cleanupInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [isOpen, isVoiceEnabled, currentUser?.id, currentUser?.username, isAuthenticated, filterExpiredMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (window.webkitSpeechRecognition || window.SpeechRecognition) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsRecording(false);
        };

        recognitionRef.current.onerror = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to use voice input');
      onAuthRequired?.();
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in your browser');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording, isAuthenticated, onAuthRequired]);

  const speakMessage = useCallback((text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isVoiceEnabled]);

  const handleImagePick = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }
    setPendingImage(file);
    const reader = new FileReader();
    reader.onload = () => setPendingPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearPending = useCallback(() => {
    setPendingImage(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const sendMessage = useCallback(async () => {
    if ((!inputValue.trim() && !pendingImage) || isSending) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to send messages');
      onAuthRequired?.();
      return;
    }

    if (!currentUser) return;

    setIsSending(true);
    const replyContext = replyTo;
    const baseContent = inputValue.trim();
    const messageContent = replyContext
      ? `↪ @${replyContext.username}: "${(replyContext.content || '[image]').slice(0, 80)}"\n${baseContent}`
      : baseContent;
    const username = currentUser.username || `User_${currentUser.id.slice(0, 4)}`;

    // Upload image first if present
    let imageUrl: string | null = null;
    if (pendingImage) {
      setIsUploading(true);
      try {
        const ext = pendingImage.name.split('.').pop() || 'jpg';
        const path = `${currentUser.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('chat-images')
          .upload(path, pendingImage, { upsert: false, contentType: pendingImage.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('chat-images').getPublicUrl(path);
        imageUrl = data.publicUrl;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || 'Failed to upload image');
        setIsSending(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      username: 'You',
      imageUrl: imageUrl || undefined,
      userId: currentUser.id,
    };
    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');
    setReplyTo(null);
    clearPending();

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: messageContent,
          username,
          user_id: currentUser.id,
          image_url: imageUrl,
        } as any);

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setInputValue(baseContent);
        setReplyTo(replyContext);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputValue(baseContent);
      setReplyTo(replyContext);
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, isAuthenticated, currentUser, onAuthRequired, pendingImage, clearPending, replyTo]);

  // Per-message actions
  const handleCopyMessage = useCallback(async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content || msg.imageUrl || '');
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  }, []);

  const handleReplyMessage = useCallback((msg: Message) => {
    setReplyTo(msg);
  }, []);

  const handleDeleteMessage = useCallback(async (msg: Message) => {
    if (!currentUser || msg.userId !== currentUser.id) {
      toast.error('You can only delete your own messages');
      return;
    }
    if (msg.id.startsWith('temp-') || msg.id === 'welcome') {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
      return;
    }
    // Optimistic removal
    const prev = messages;
    setMessages(curr => curr.filter(m => m.id !== msg.id));
    const { error } = await supabase.from('chat_messages').delete().eq('id', msg.id);
    if (error) {
      console.error(error);
      toast.error('Failed to delete message');
      setMessages(prev);
    } else {
      toast.success('Message deleted');
    }
  }, [currentUser, messages]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-24 right-4 md:bottom-24 md:right-8 z-[60] w-[calc(100vw-2rem)] sm:w-96 max-w-md"
      >
        <Card className="glass-ultra border-primary/40 overflow-hidden shadow-2xl shadow-primary/30 rounded-2xl">
          {/* Header */}
          <div className="relative flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-br from-primary/30 via-accent/15 to-transparent overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.4),transparent_60%)] pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  Global Chat
                  {isConnected && (
                    <Wifi className="w-3 h-3 text-green-400" />
                  )}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {onlineUsers.length > 0 ? `${onlineUsers.length} online` : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className="w-8 h-8"
              >
                {isVoiceEnabled ? (
                  <Volume2 className="w-4 h-4 text-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Online Users */}
          {onlineUsers.length > 0 && (
            <div className="px-4 py-2 border-b border-border/30 bg-primary/5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Online:</span>
                {onlineUsers.slice(0, 5).map((user, idx) => (
                  <span key={idx} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {user}
                  </span>
                ))}
                {onlineUsers.length > 5 && (
                  <span className="text-xs text-muted-foreground">+{onlineUsers.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="h-72 sm:h-80 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, idx) => {
                const isOwn = !!currentUser && message.userId === currentUser.id;
                const canShowActions = message.sender !== 'system';
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`group flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative max-w-[85%] rounded-xl p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary/20 border border-primary/40'
                          : message.sender === 'system'
                          ? 'bg-card/80 border border-border/50'
                          : 'bg-purple-500/10 border border-purple-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        {message.username ? (
                          <p className="text-xs text-primary font-semibold">{message.username}{isOwn && ' (you)'}</p>
                        ) : <span />}
                        {canShowActions && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label="Message actions"
                                className="p-1 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 z-[100]">
                              <DropdownMenuItem onClick={() => handleReplyMessage(message)}>
                                <Reply className="w-4 h-4 mr-2" /> Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyMessage(message)}>
                                <Copy className="w-4 h-4 mr-2" /> Copy text
                              </DropdownMenuItem>
                              {isOwn && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(message)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {message.imageUrl && (
                        <a
                          href={message.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mb-2"
                        >
                          <img
                            src={message.imageUrl}
                            alt="Anomaly photo shared in chat"
                            loading="lazy"
                            className="rounded-lg max-h-48 w-auto border border-border/40 hover:opacity-90 transition-opacity"
                          />
                        </a>
                      )}
                      {message.content && (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Speaking...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border/50 bg-card/50 space-y-2">
            {isAuthenticated ? (
              <>
                {/* Reply preview */}
                {replyTo && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                    <CornerDownRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-primary font-semibold">Replying to {replyTo.username}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {replyTo.content || '[image]'}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyTo(null)}
                      aria-label="Cancel reply"
                      className="p-0.5 rounded hover:bg-foreground/10"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
                {/* Image preview */}
                {pendingPreview && (
                  <div className="relative inline-block">
                    <img
                      src={pendingPreview}
                      alt="Pending upload"
                      className="rounded-lg max-h-32 border border-primary/30"
                    />
                    <button
                      onClick={clearPending}
                      aria-label="Remove image"
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleImagePick(e.target.files?.[0] || null)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload anomaly photo"
                    className="shrink-0"
                    disabled={isSending}
                    title="Upload an anomaly photo"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                  <Popover modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Insert emoji"
                        className="shrink-0"
                        disabled={isSending}
                        title="Insert emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="end"
                      sideOffset={8}
                      className="p-0 border border-border/40 bg-background shadow-xl w-auto z-[200] overflow-hidden rounded-lg"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Suspense fallback={<div className="w-[300px] h-[360px] flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>}>
                        <EmojiPicker
                          theme={'dark' as any}
                          width={300}
                          height={360}
                          onEmojiClick={(emojiData: { emoji: string }) => {
                            setInputValue((v) => v + emojiData.emoji);
                          }}
                          lazyLoadEmojis
                          searchPlaceHolder="Search emojis..."
                          previewConfig={{ showPreview: false }}
                        />
                      </Suspense>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleRecording}
                    aria-label={isRecording ? "Stop recording" : "Start voice input"}
                    className={`shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={isRecording ? "Listening..." : pendingImage ? "Add a caption..." : "Type or speak..."}
                    className="bg-background/50 border-border/50"
                    disabled={isSending}
                    aria-label="Chat message"
                  />
                  <Button
                    onClick={sendMessage}
                    className="shrink-0 gap-2"
                    aria-label="Send message"
                    disabled={isSending || (!inputValue.trim() && !pendingImage)}
                  >
                    {isSending || isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
                  <Camera className="w-3 h-3" />
                  Share a live anomaly photo — images stay public for 1 hour.
                </p>
              </>
            ) : (
              <Button
                onClick={onAuthRequired}
                className="w-full gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign in to chat
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceChat;
