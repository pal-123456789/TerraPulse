## Add an AI Assistant chatbot

Add a dedicated AI chatbot ("TerraPulse AI") that can answer any question — separate from the existing Global Chat (which is human-to-human). Streaming responses, markdown rendering, conversation memory within a session.

### What the user gets

- A new floating button in the bottom-right corner labeled "AI Assistant" with a Sparkles icon (the existing Global Chat button stays in bottom-left).
- Click it → glassmorphic chat panel opens above the button.
- Type any question → AI streams a markdown-formatted answer token-by-token.
- Conversation history persists for the open session (cleared on page reload — no DB writes, keeps it simple and free of RLS work).
- "Clear chat" and "Close" buttons in the header.
- Suggestion chips on first open: "Explain climate anomalies", "What is the Terra satellite?", "How does this app work?".
- Works for everyone (no login required) — public edge function, but rate-limited per IP/session to prevent abuse.

### Technical implementation

**1. New edge function** `supabase/functions/ai-chat/index.ts`
- Public (`verify_jwt = false`) so guests can use it.
- Accepts `{ messages: [{role, content}, ...] }`.
- Calls Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) with `google/gemini-3-flash-preview`, `stream: true`.
- System prompt: "You are TerraPulse AI, a helpful assistant. Answer any question clearly and concisely. When relevant, relate answers to environmental monitoring, climate, satellites, or Earth science."
- Returns the SSE stream directly with proper CORS headers.
- Handles 429 (rate limit) and 402 (credits exhausted) → returns JSON error so the UI can toast.
- Light in-memory rate limit (20 req/min per IP) as defense-in-depth.

**2. Add `supabase/config.toml` entry** for the new function with `verify_jwt = false`.

**3. New component** `src/components/Chat/AIAssistant.tsx`
- Self-contained: button + panel, mirrors `ChatButton.tsx` styling but right-aligned.
- Uses the streaming pattern from the Lovable AI knowledge: line-by-line SSE parser, updates the last assistant message on each token.
- Renders messages with `react-markdown` (already common; will install if not present) inside `prose prose-sm prose-invert` for markdown formatting.
- AbortController to cancel in-flight requests when user closes the panel or sends a new message.
- Suggestion chips shown only when message list is empty.
- Auto-scroll to bottom on new tokens.

**4. Wire into `App.tsx`**
- Add `<AIAssistant />` inside `FloatingLayer` next to `<ChatButton />`.
- Hidden on the same routes (`/privacy`, `/terms`).

**5. Styling**
- Reuse existing tokens: `glass-ultra`, `border-primary/40`, gradient header.
- Position: `fixed bottom-6 right-4 md:bottom-8 md:right-8` for the button (left side stays for global chat). Panel opens above it.
- Distinct accent: violet/cyan gradient + Sparkles icon so users can tell AI apart from Global Chat.

### Files

**New:**
- `supabase/functions/ai-chat/index.ts`
- `src/components/Chat/AIAssistant.tsx`

**Edited:**
- `supabase/config.toml` (register `ai-chat` with `verify_jwt = false`)
- `src/App.tsx` (mount `<AIAssistant />` in `FloatingLayer`)
- `package.json` (add `react-markdown` if missing)

### Notes

- Uses `LOVABLE_API_KEY` (already configured — confirmed in secrets).
- No database changes required → no migration approval needed.
- No new secrets requested.
- Free model `google/gemini-3-flash-preview` keeps cost low and latency fast.
