// Procedural Web Audio API sound generator - no external MP3 dependencies required
export function playSound(
  type: "bell" | "digital" | "chime" | "marimba" = "bell",
  volume: number = 0.7
) {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "bell") {
      // Warm resonant bell
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === "digital") {
      // 3 crisp digital beeps
      [0, 0.15, 0.3].forEach((offset) => {
        const osc = ctx.createOscillator();
        const beepGain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(1200, now + offset);

        beepGain.gain.setValueAtTime(volume * 0.4, now + offset);
        beepGain.gain.setValueAtTime(0, now + offset + 0.08);

        osc.connect(beepGain);
        beepGain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } else if (type === "chime") {
      // Uplifting 3-tone chime (C5 - E5 - G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.15);

        g.gain.setValueAtTime(volume * 0.6, now + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.9);
      });
    } else if (type === "marimba") {
      // Soft woodblock/marimba double hit
      [440, 660].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + i * 0.12);

        g.gain.setValueAtTime(volume * 0.7, now + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.5);
      });
    }
  } catch (err) {
    console.warn("Could not play timer sound:", err);
  }
}

export function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
}

export function sendBrowserNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      } catch (e) {
        console.warn("Notification error:", e);
      }
    }
  }
}

