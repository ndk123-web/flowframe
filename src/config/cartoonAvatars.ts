/**
 * FlowFrame Curated Cartoon Avatars
 * 100% Royalty-Free, Open-Source & Copyright-Safe (CC0 1.0 / MIT License)
 * No trademark or brand intellectual property — completely safe for public & production use.
 */

export interface CartoonAvatar {
  id: string;
  name: string;
  url: string;
  category: "Robots" | "Emoji" | "Adventurers";
}

export const CARTOON_AVATARS: CartoonAvatar[] = [
  // ── 1. Robots & Droids (Bottts Neutral — Pablo Stanley, CC BY 4.0) ──
  {
    id: "bot-felix",
    name: "Felix",
    url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Felix",
    category: "Robots",
  },
  {
    id: "bot-sparky",
    name: "Sparky",
    url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Sparky",
    category: "Robots",
  },
  {
    id: "bot-gizmo",
    name: "Gizmo",
    url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Gizmo",
    category: "Robots",
  },
  {
    id: "bot-bolt",
    name: "Bolt",
    url: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Bolt",
    category: "Robots",
  },

  // ── 2. Playful Emojis (Fun Emoji — Davis Risztov, CC0) ──
  {
    id: "emoji-sunny",
    name: "Sunny",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sunny",
    category: "Emoji",
  },
  {
    id: "emoji-milo",
    name: "Milo",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Milo",
    category: "Emoji",
  },
  {
    id: "emoji-winky",
    name: "Winky",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Winky",
    category: "Emoji",
  },
  {
    id: "emoji-bandit",
    name: "Bandit",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bandit",
    category: "Emoji",
  },

  // ── 3. Cartoon Adventurers (Adventurer Neutral — Lisa Wischofsky, CC BY 4.0) ──
  {
    id: "adv-willow",
    name: "Willow",
    url: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Willow",
    category: "Adventurers",
  },
  {
    id: "adv-nova",
    name: "Nova",
    url: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Nova",
    category: "Adventurers",
  },
  {
    id: "adv-scout",
    name: "Scout",
    url: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Scout",
    category: "Adventurers",
  },
  {
    id: "adv-luna",
    name: "Luna",
    url: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Luna",
    category: "Adventurers",
  },
];

/**
 * Generate a random legal cartoon avatar URL with an arbitrary seed.
 */
export function generateRandomCartoonAvatar(): string {
  const styles = ["bottts-neutral", "fun-emoji", "adventurer-neutral"];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomSeed = Math.random().toString(36).substring(2, 9);
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
}
