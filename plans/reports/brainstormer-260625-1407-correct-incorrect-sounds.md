# Brainstorm: Play Correct/Incorrect Sound Effects

Evaluate approaches to play custom sound effects (`correct.mp3` and `incorrect.mp3`) when teams answer correctly or incorrectly in the games "Giai điệu vượt ngàn" and "Mật mã lặng thinh".

## Problem Statement & Requirements
Currently, the system uses the Web Audio API synthesis (sine/triangle oscillators) to programmatically generate audio tones for correct and incorrect answers inside [sounds.ts](file:///Users/vinhcuong/Dev/gala-game/frontend/src/lib/sounds.ts). 
The user wants to replace these synthetic sounds with two pre-recorded MP3 files already in the workspace:
*   [correct.mp3](file:///Users/vinhcuong/Dev/gala-game/frontend/src/assets/correct.mp3)
*   [incorrect.mp3](file:///Users/vinhcuong/Dev/gala-game/frontend/src/assets/incorrect.mp3)

This must trigger when teams answer correct/incorrect in the two games:
1.  **Giai điệu vượt ngàn** (Humming)
2.  **Mật mã lặng thinh** (Charades / Tam sao thất bản)

## Evaluated Approaches

---

### Option 1: Centralized Integration in [sounds.ts](file:///Users/vinhcuong/Dev/gala-game/frontend/src/lib/sounds.ts) (Recommended)
Import the MP3 assets directly into `sounds.ts` and update `playCorrect()` and `playWrong()` using standard `HTMLAudioElement` (`new Audio(asset)`) with oscillator fallbacks.

*   **Pros:**
    *   **Simple & DRY:** No changes needed to `GameEffects.tsx`, `DisplayPage.tsx`, or any controller/page components.
    *   **Fallback protection:** If `new Audio` fails (e.g. autoplay restriction/loading issues), it can gracefully fall back to the synthetic oscillator sounds.
    *   **Clean Abstraction:** Keeps sound playing code isolated inside the designated sound module instead of polluting view files.
*   **Cons:**
    *   Will affect any other game mode that uses these methods, though they currently don't check live correctness, and if they do, playing the same sound maintains UX consistency.

---

### Option 2: Component-Level Playback in `GameEffects.tsx`
Play the audio files directly inside [GameEffects.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/GameEffects.tsx) where the websocket `correct` and `wrong` actions are intercepted.

*   **Pros:**
    *   Keeps sound playback logic closer to visual effects (confetti, shake).
*   **Cons:**
    *   **Violates DRY:** Bypasses `sounds.ts` abstraction, separating sound concerns into multiple files.
    *   Makes unit testing `GameEffects` harder due to direct asset imports and audio instance creation inside React lifecycles.

---

### Option 3: Play via `<audio>` tags in `DisplayPage.tsx`
Create `<audio>` tags in [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx) and trigger them via DOM `useRef` handles.

*   **Pros:**
    *   Matches how the background music is currently implemented.
*   **Cons:**
    *   Increases clutter in `DisplayPage.tsx` with more references and audio tags.
    *   Bypasses the `sounds` utility module.

---

## Final Recommended Solution: Option 1

Modify `sounds.ts` to load `correct.mp3` and `incorrect.mp3`. When `playCorrect` or `playWrong` is called, play the respective MP3 sound. If it fails (due to browser autoplay policies or loading issues), fallback to the synthetic tone.

```typescript
import correctSound from '@/assets/correct.mp3';
import incorrectSound from '@/assets/incorrect.mp3';

class SoundManager {
  private correctAudio: HTMLAudioElement | null = null;
  private incorrectAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.correctAudio = new Audio(correctSound);
      this.incorrectAudio = new Audio(incorrectSound);
    }
  }
  
  // ... (rest of methods)
}
```

## Implementation Considerations & Risks
*   **Autoplay Restrictions:** Browsers block audio playback unless there has been a user interaction (like a click) on the document. `DisplayPage.tsx` handles this via `onClick={handleInteract}` on the top-level container, which will unlock the audio context for the page.
*   **Latency:** Standard `new Audio()` preloads the asset, which is fast and responsive. Since these files are tiny (~15-20KB), latency will be minimal.

## Success Metrics & Validation
*   Audio successfully plays on `DisplayPage.tsx` when MC triggers correct/incorrect buttons.
*   No TypeScript compilation or console errors regarding asset imports.

## Next Steps
1.  Align with user on Option 1.
2.  Modify [sounds.ts](file:///Users/vinhcuong/Dev/gala-game/frontend/src/lib/sounds.ts) to play the MP3 files.
3.  Test by simulating correct/incorrect events or running the local server.
