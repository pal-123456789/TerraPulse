import { useCallback, useRef, useState, useEffect } from 'react';

interface VoiceGuidanceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useVoiceGuidance = (options: VoiceGuidanceOptions = {}) => {
  const { rate = 1.0, pitch = 1.0, volume = 0.8 } = options;
  const lastSpokenRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('voiceGuidanceEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Save preference
  useEffect(() => {
    localStorage.setItem('voiceGuidanceEnabled', String(isEnabled));
  }, [isEnabled]);

  // Get best available voice
  const getVoice = useCallback(() => {
    if (!('speechSynthesis' in window)) return null;
    
    const voices = window.speechSynthesis.getVoices();
    // Prefer high-quality voices
    const preferredVoices = ['Google', 'Microsoft', 'Natural', 'Samantha', 'Alex', 'Karen'];
    
    for (const preferred of preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferred) && v.lang.startsWith('en'));
      if (voice) return voice;
    }
    
    // Fallback to any English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }, []);

  const speak = useCallback((text: string, priority = false) => {
    if (!isEnabled) return;
    
    // Prevent repeating the same message within 3 seconds
    if (!priority && text === lastSpokenRef.current) return;
    
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech if priority
      if (priority) {
        window.speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      
      const voice = getVoice();
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      lastSpokenRef.current = text;
      
      // Clear after 3 seconds
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastSpokenRef.current = '';
      }, 3000);
    }
  }, [isEnabled, rate, pitch, volume, getVoice]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Contextual guidance for non-clickable elements
  const getContextualGuidance = useCallback((element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const textContent = element.textContent?.trim().slice(0, 100) || '';
    const ariaLabel = element.getAttribute('aria-label');
    const title = element.getAttribute('title');
    
    // Use aria-label or title if available
    if (ariaLabel) return ariaLabel;
    if (title) return title;
    
    // Provide context based on element type and content
    if (tagName === 'section' || className.includes('section')) {
      return `You're in a section. ${textContent.slice(0, 50)}. Use the navigation menu or buttons to interact.`;
    }
    
    if (tagName === 'header' || className.includes('header')) {
      return 'This is the header area. Look for navigation links or menu buttons.';
    }
    
    if (tagName === 'footer' || className.includes('footer')) {
      return 'This is the footer. It contains links and information about the site.';
    }
    
    if (tagName === 'nav' || className.includes('nav')) {
      return 'This is the navigation area. Click on the links to navigate.';
    }
    
    if (className.includes('card') || className.includes('Card')) {
      const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading?.textContent) {
        return `This is a card about ${heading.textContent}. Look for buttons or links inside to interact.`;
      }
      return 'This is a card. Look for buttons or links inside to interact.';
    }
    
    if (className.includes('hero')) {
      return 'This is the hero section. Look for call-to-action buttons below.';
    }
    
    // Check for headings and provide context
    const nearestHeading = element.closest('section, article, div')?.querySelector('h1, h2, h3, h4');
    if (nearestHeading?.textContent) {
      return `You're viewing content about ${nearestHeading.textContent}. Use buttons or links to interact.`;
    }
    
    // Check for nearby interactive elements
    const nearbyButton = element.querySelector('button') || element.closest('div')?.querySelector('button');
    const nearbyLink = element.querySelector('a') || element.closest('div')?.querySelector('a');
    
    if (nearbyButton) {
      return `Try clicking the "${nearbyButton.textContent?.trim() || 'nearby'}" button.`;
    }
    
    if (nearbyLink) {
      return `Try clicking the "${nearbyLink.textContent?.trim() || 'nearby'}" link.`;
    }
    
    // Generic guidance with helpful tips
    if (textContent.length > 10) {
      return `${textContent.slice(0, 60)}. This is informational text. Navigate using the menu or buttons.`;
    }
    
    return 'This area is for display only. Use the navigation menu, buttons, or links to interact with the site.';
  }, []);

  const speakOnNonClickable = useCallback((e: React.MouseEvent) => {
    if (!isEnabled) return;
    
    const target = e.target as HTMLElement;
    
    // Check if element is clickable
    const isClickable = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'LABEL' ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[data-clickable]') ||
      target.closest('input') ||
      target.closest('select') ||
      target.hasAttribute('onclick') ||
      window.getComputedStyle(target).cursor === 'pointer';

    if (!isClickable) {
      const guidance = getContextualGuidance(target);
      speak(guidance);
    }
  }, [isEnabled, speak, getContextualGuidance]);

  // Announce page navigation
  const announceNavigation = useCallback((pageName: string) => {
    if (isEnabled) {
      speak(`Navigated to ${pageName} page`, true);
    }
  }, [isEnabled, speak]);

  // Announce actions
  const announceAction = useCallback((action: string) => {
    if (isEnabled) {
      speak(action, true);
    }
  }, [isEnabled, speak]);

  // Toggle voice guidance
  const toggle = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      if (newValue) {
        speak('Voice guidance enabled', true);
      } else {
        // Speak before disabling
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Voice guidance disabled');
          window.speechSynthesis.speak(utterance);
        }
      }
      return newValue;
    });
  }, [speak]);

  return { 
    speak, 
    speakOnNonClickable, 
    stop,
    isEnabled,
    isSpeaking,
    toggle,
    announceNavigation,
    announceAction
  };
};

export default useVoiceGuidance;
