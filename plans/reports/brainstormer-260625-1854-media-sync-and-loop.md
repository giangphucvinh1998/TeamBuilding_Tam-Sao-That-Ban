# Brainstorming Report: Media Synchronization and Auto-Looping for Game 2

## 1. Problem & Objectives
The user wants to simplify and synchronize the media playback in Game 2 (Giai điệu ngân nga / Humming):
1. **Single Action Trigger**: Clicking play should automatically start the media playback and trigger the 30s countdown timer on the display. No separate "Phát nhạc" and "Tính giờ" buttons.
2. **Auto-Stop**: If the song is longer than 30s, it must automatically stop/pause at the end of the 30s countdown.
3. **Auto-Loop**: If the song is shorter than 30s, it must automatically loop (restart from the beginning) until the 30s period is complete.

---

## 2. Proposed Solution

### A. Auto-Looping & Auto-Stopping
By utilizing the HTML5 `<video>` / `<audio>` native `loop` attribute, we can make any media file loop automatically:
- In `frontend/src/components/display/HummingDisplay.tsx`, we will add `loop={true}` to both the background audio `<video>` element and the main video element.
- When the 30-second timer expires in the backend, the state machine transitions to `THINKING` and sets `is_media_playing = False`. The client automatically pauses the video/audio, effectively stopping it at exactly 30 seconds.

### B. Single Button flow in Admin Panel
Instead of showing two buttons (`PHÁT ĐĨA NHẠC` and `BẮT ĐẦU TÍNH GIỜ`) in the `READY` state, we merge them into a single action button:
- For normal songs: `▶ PHÁT NHẠC & TÍNH GIỜ (30s)`
- For final live songs: `⏱ BẮT ĐẦU LƯỢT LIVE (30s)`
Both buttons will call the `/humming/start-playing` API, which sets `is_media_playing = True` and starts the 30s countdown in one call.

---

## 3. UI/UX Changes

### Admin Panel (`HummingController.tsx`)
```typescript
{state === 'READY' && (
  <div className="flex gap-4">
    <button 
      onClick={handleStartTimer}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-black text-xl shadow-lg transition-transform active:scale-95"
    >
      {is_final_live ? '⏱ BẮT ĐẦU LƯỢT LIVE (30s)' : '▶ PHÁT NHẠC & TÍNH GIỜ (30s)'}
    </button>
  </div>
)}
```

### Display Screen (`HummingDisplay.tsx`)
```html
<video 
  ref={mediaRef} 
  src={current_song.media_url} 
  playsInline 
  loop={true} 
  onEnded={handleMediaEnded} 
  className="w-px h-px" 
/>
```
