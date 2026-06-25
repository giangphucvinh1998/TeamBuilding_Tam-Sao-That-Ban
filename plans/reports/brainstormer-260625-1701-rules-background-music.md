# Brainstorm: Play Background Music on Rules Open

## Problem Statement & Requirements
- Play the background music from `@/assets/background-rule-game.mp3` when the game rules overlay is opened.
- Stop/Pause the music immediately when the rules overlay is closed/hidden for any reason (manually toggled or auto-hidden when starting a game).

---

## Technical Analysis

### Triggering Playback
1. **Source of Truth:** The visibility of the rules overlay is controlled by `gameState?.show_rules` (synced via WebSocket).
2. **React Effect:** We can track `gameState?.show_rules` in a `useEffect` hook in `DisplayPage.tsx`. When `true`, we play the audio; when `false` (or undefined), we pause and reset the audio track.
3. **Browser Autoplay Restrictions:** Browsers typically block audio autoplay before a user interaction. To circumvent this, we'll also trigger the rule audio playback inside the `handleInteract` handler (which fires when the user clicks anywhere on the screen).

---

## Proposed Code Changes in `DisplayPage.tsx`

### 1. Imports
Import the audio asset:
```tsx
import backgroundRuleAudio from '@/assets/background-rule-game.mp3';
```

### 2. Reference Hook
Declare a reference hook for the audio element:
```tsx
const backgroundRuleRef = useRef<HTMLAudioElement>(null);
```

### 3. Audio Control Effect
Use `useEffect` to respond to state changes:
```tsx
  useEffect(() => {
    if (gameState?.show_rules) {
      backgroundRuleRef.current?.play().catch(e => {
        console.warn("Autoplay rules audio blocked, waiting for interaction:", e);
      });
    } else {
      backgroundRuleRef.current?.pause();
      if (backgroundRuleRef.current) {
        backgroundRuleRef.current.currentTime = 0;
      }
    }
  }, [gameState?.show_rules]);
```

### 4. Interactive Playback Fallback
In `handleInteract()`:
```tsx
    if (gameState?.show_rules) {
      backgroundRuleRef.current?.play().catch(e => console.warn("Interactive rules play failed:", e));
    }
```

### 5. Render HTML Audio Tag
Add the `<audio>` element to both rendering trees in `DisplayPage.tsx`:
```tsx
<audio ref={backgroundRuleRef} src={backgroundRuleAudio} loop />
```

---

## Implementation Considerations & Risks
- **Autoplay blocks:** The fallback inside `handleInteract` is crucial because team building display computers might start without active user clicks. Clicking anywhere on screen will play it.
- **Audio Overlap:** When rules are closed and a game starts, the game audio (e.g. `game1Audio`) plays. Since the rules auto-hide, `gameState?.show_rules` will turn false, pausing `backgroundRuleRef` immediately, preventing overlapping tracks.

---

## Next Steps
1. User approves the plan.
2. Edit `frontend/src/pages/DisplayPage.tsx`.
3. Verify build, syntax, and functionality.
