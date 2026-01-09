import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceChat from './VoiceChat';

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed bottom-6 left-4 md:bottom-8 md:left-8 z-40"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full w-14 h-14 md:w-16 md:h-16 shadow-2xl shadow-primary/40 relative group bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-2 border-primary/50"
            >
              <MessageCircle className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
              
              {/* Ripple effect */}
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
              
              {/* Glow effect */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />
            </Button>
            
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
            >
              <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1.5 text-sm font-medium shadow-lg">
                <span className="text-green-400">●</span>
                <span className="ml-2">Global Chat</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <VoiceChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatButton;