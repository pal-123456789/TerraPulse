import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X, MessageCircle, Volume2, VolumeX, Loader2, Users, Wifi, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const scrollRef = useRef<HTMLDivElement>(null);
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
        .from('chat_messages')
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
          id: msg.id,
          content: msg.content,
          sender: msg.user_id === currentUser?.id ? 'user' : 'other',
          timestamp: new Date(msg.created_at),
          username: msg.username
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
          const newMsg = payload.new as { id: string; content: string; username: string; created_at: string; user_id: string };
          const message: Message = {
            id: newMsg.id,
            content: newMsg.content,
            sender: newMsg.user_id === currentUser?.id ? 'user' : 'other',
            timestamp: new Date(newMsg.created_at),
            username: newMsg.username
          };
          setMessages(prev => [...prev, message]);
          
          // Speak incoming message if voice is enabled and not from current user
          if (isVoiceEnabled && newMsg.user_id !== currentUser?.id && 'speechSynthesis' in window) {
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

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to send messages');
      onAuthRequired?.();
      return;
    }

    if (!currentUser) return;

    setIsSending(true);
    const messageContent = inputValue.trim();
    const username = currentUser.username || `User_${currentUser.id.slice(0, 4)}`;

    // Optimistic update - show message immediately
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      username: 'You'
    };
    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: messageContent,
          username: username,
          user_id: currentUser.id
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setInputValue(messageContent);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputValue(messageContent);
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, isAuthenticated, currentUser, onAuthRequired]);

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
        <Card className="glass-ultra border-primary/30 overflow-hidden shadow-2xl shadow-primary/20">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
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
              {messages.map((message, idx) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary/20 border border-primary/40'
                        : message.sender === 'system'
                        ? 'bg-card/80 border border-border/50'
                        : 'bg-purple-500/10 border border-purple-500/30'
                    }`}
                  >
                    {message.username && (
                      <p className="text-xs text-primary font-semibold mb-1">{message.username}</p>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Speaking...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border/50 bg-card/50">
            {isAuthenticated ? (
              <div className="flex gap-2">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleRecording}
                  className={`shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={isRecording ? "Listening..." : "Type or speak..."}
                  className="bg-background/50 border-border/50"
                  disabled={isSending}
                />
                <Button 
                  onClick={sendMessage} 
                  className="shrink-0 gap-2"
                  disabled={isSending || !inputValue.trim()}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
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
