import grain from "@/assets/grain.svg";
import logoGemini from "@/assets/logo-gemini.svg";
import logoGroq from "@/assets/logo-groq.svg";
import logoHuggingface from "@/assets/logo-huggingface.svg";
import logoOpenrouter from "@/assets/logo-openrouter.svg";
import mark from "@/assets/orvant-mark.png";
import markApricot from "@/assets/orvant-mark-apricot.png";
import markInk from "@/assets/orvant-mark-ink.png";
import markLight from "@/assets/orvant-mark-light.png";
import wordLight from "@/assets/orvant-word-light.png";
import wordmark from "@/assets/orvant-wordmark.png";
import wordmarkLight from "@/assets/orvant-wordmark-light.png";

/** Brand assets by their file name in /assets, as URLs. */
export const A = {
  "grain.svg": grain.src,
  "logo-gemini.svg": logoGemini.src,
  "logo-groq.svg": logoGroq.src,
  "logo-huggingface.svg": logoHuggingface.src,
  "logo-openrouter.svg": logoOpenrouter.src,
  "orvant-mark.png": mark.src,
  "orvant-mark-apricot.png": markApricot.src,
  "orvant-mark-ink.png": markInk.src,
  "orvant-mark-light.png": markLight.src,
  "orvant-word-light.png": wordLight.src,
  "orvant-wordmark.png": wordmark.src,
  "orvant-wordmark-light.png": wordmarkLight.src,
} as const;
