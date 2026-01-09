import { useCallback, useRef } from 'react';

export const useVoiceGuidance = () => {
  const lastSpokenRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const speak = useCallback((text: string, priority = false) => {
    // Prevent repeating the same message within 2 seconds
    if (!priority && text === lastSpokenRef.current) return;
    
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech if priority
      if (priority) {
        window.speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.7;
      
      // Try to use a natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google') || 
        v.name.includes('Natural') ||
        v.name.includes('Samantha')
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
      lastSpokenRef.current = text;
      
      // Clear after 2 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastSpokenRef.current = '';
      }, 2000);
    }
  }, []);

  const speakOnNonClickable = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isClickable = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[data-clickable]') ||
      window.getComputedStyle(target).cursor === 'pointer';

    if (!isClickable) {
      // Get context from nearby text
      const nearbyText = target.textContent?.trim().slice(0, 50);
      const tagName = target.tagName.toLowerCase();
      
      let guidance = '';
      
      if (nearbyText) {
        guidance = `This is ${nearbyText}. Look for buttons or links to interact.`;
      } else if (tagName === 'div' || tagName === 'section') {
        guidance = 'This area is not interactive. Try clicking buttons or menu items.';
      } else {
        guidance = 'No action available here. Navigate using the menu or buttons.';
      }
      
      speak(guidance);
    }
  }, [speak]);

  return { speak, speakOnNonClickable };
};

export default useVoiceGuidance;
