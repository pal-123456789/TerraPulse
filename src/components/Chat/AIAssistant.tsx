import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2, Trash2, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

type Role = 'user' | 'assistant';
interface Msg { role: Role; content: string }

const SUGGESTIONS = [
  'How does TerraPulse detect anomalies?',
  'What is the Terra satellite?',
  'Explain climate feedback loops',
  'Give me 3 tips to reduce my carbon footprint',
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface AIAssistantProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const AIAssistant = ({ open: controlledOpen, onOpenChange, hideTrigger = false }: AIAssistantProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Cancel stream on unmount/close
  useEffect(() => {
    if (!isOpen && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsStreaming(false);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const next: Msg[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setIsStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        let errMsg = 'Failed to reach AI assistant.';
        try {
          const j = await resp.json();
          if (j?.error) errMsg = j.error;
        } catch { /* ignore */ }
        if (resp.status === 429) toast.error(errMsg || 'Rate limited. Please slow down.');
        else if (resp.status === 402) toast.error('AI credits exhausted. Add credits in Settings.');
        else toast.error(errMsg);
        setMessages(prev => prev.filter((_, i) => i !== prev.length - 1 || prev[prev.length - 1].role !== 'assistant'));
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) upsert(delta);
          } catch {
            // partial JSON — restore line and wait for more
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush leftovers
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (!raw.startsWith('data: ')) continue;
          const json = raw.slice(6).trim();
          if (json === '[DONE]') continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) upsert(delta);
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('AI chat error:', e);
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming]);

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  };

  return (
    <>
      {!hideTrigger && (
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 40 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
              className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40"
            >
              <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                aria-label="Open AI Assistant"
                className="relative rounded-full w-16 h-16 shadow-2xl bg-gradient-to-br from-accent to-primary text-primary-foreground"
              >
                <Sparkles className="w-7 h-7" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 md:bottom-24 md:right-8 z-[60] w-[calc(100vw-2rem)] sm:w-[28rem] max-w-lg"
          >
            <Card className="glass-ultra border-accent/40 overflow-hidden shadow-2xl shadow-accent/30 rounded-2xl">
              {/* Header */}
              <div className="relative flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-br from-accent/30 via-primary/15 to-transparent overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.4),transparent_60%)] pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/40">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground leading-tight">TerraPulse AI</h3>
                    <p className="text-[11px] text-muted-foreground">Ask me anything</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 relative z-10">
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearChat}
                      className="w-8 h-8"
                      aria-label="Clear chat"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="w-8 h-8" aria-label="Close">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-80 sm:h-96 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-full gap-4 py-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center border border-accent/40">
                      <Bot className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Hi, I'm TerraPulse AI</p>
                      <p className="text-xs text-muted-foreground mt-1">Ask me anything — climate, science, or general questions.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 w-full mt-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="text-left text-xs px-3 py-2 rounded-lg bg-card/60 hover:bg-accent/10 border border-border/50 hover:border-accent/40 transition-colors text-foreground/80 hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {m.role === 'assistant' && (
                          <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-md shadow-accent/30">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            m.role === 'user'
                              ? 'bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40 text-foreground'
                              : 'bg-card/80 border border-border/60 text-foreground'
                          }`}
                        >
                          {m.role === 'assistant' ? (
                            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-pre:my-2 prose-pre:bg-background/60 prose-pre:border prose-pre:border-border/60 prose-code:text-accent prose-code:before:content-none prose-code:after:content-none prose-strong:text-foreground prose-headings:text-foreground prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-a:text-accent">
                              <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          )}
                        </div>
                        {m.role === 'user' && (
                          <div className="w-7 h-7 shrink-0 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pl-9">
                        <Loader2 className="w-3 h-3 animate-spin text-accent" />
                        <span>Thinking…</span>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border/50 bg-card/40">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isStreaming ? 'Generating answer…' : 'Ask me anything…'}
                    disabled={isStreaming}
                    className="flex-1 bg-background/60 border-border/60 focus-visible:ring-accent"
                    aria-label="Message TerraPulse AI"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isStreaming || !input.trim()}
                    className="shrink-0 bg-gradient-to-br from-accent to-primary hover:opacity-90 text-primary-foreground"
                    aria-label="Send"
                  >
                    {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  AI responses can be inaccurate. Verify important info.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
