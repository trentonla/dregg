// Optional on-device speech. Never required for a session, never a network call.
export function createAudio() {
  const synth = typeof globalThis.speechSynthesis !== "undefined" ? globalThis.speechSynthesis : null;
  let voice = null;

  function pickVoice() {
    if (!synth || typeof synth.getVoices !== "function") return null;
    const voices = synth.getVoices();
    return voices.find((entry) => /^en[-_]US/i.test(entry.lang)) || voices.find((entry) => /^en/i.test(entry.lang)) || null;
  }

  return {
    available: Boolean(synth),
    speak(text) {
      if (!synth || !text) return false;
      try {
        synth.cancel();
        voice = voice || pickVoice();
        const utterance = new SpeechSynthesisUtterance(String(text));
        utterance.lang = "en-US";
        utterance.rate = 0.85;
        utterance.pitch = 1;
        if (voice) utterance.voice = voice;
        synth.speak(utterance);
        return true;
      } catch {
        return false;
      }
    },
    stop() {
      if (synth) synth.cancel();
    },
  };
}
