import { useState } from "react";

const EMOJI_LIST = [
  // Животные
  "🐊", "🦄", "🐙", "🐸", "🦊", "🐼", "🐨", "🦁", "🐯", "🐻",
  "🐺", "🦝", "🐮", "🐷", "🐵", "🐶", "🐱", "🐰", "🐹", "🐭",
  "🦉", "🦅", "🐧", "🐦", "🦜", "🐤", "🦋", "🐝", "🐞", "🐢",
  "🐠", "🐬", "🦈", "🐳", "🦀", "🦞", "🐚", "🐍", "🦎", "🐲",
  "🦩", "🦚", "🐻‍❄️", "🦦", "🦥", "🦫", "🦔", "🐿️", "🦇", "🦗",
  // Природа
  "🌸", "🌺", "🌻", "🌹", "🍀", "🌴", "🌙", "⭐", "🔥", "💎",
  "🌈", "☁️", "🍄", "🧊", "🪐", "☀️", "🌊", "🌪️", "❄️", "🌿",
  "🪻", "🌷", "🌼", "🏵️", "🍁", "🍂", "🍃", "🌾", "🎋", "🎍",
  // Еда
  "🍕", "🍔", "🍟", "🌮", "🍣", "🍩", "🍪", "🎂", "🧁", "🍰",
  "🍫", "🍬", "🍭", "🍿", "🥤", "☕", "🧃", "🍷", "🍺", "🧋",
  // Предметы и символы
  "🎮", "🎨", "🎵", "🎭", "🏆", "⚡", "💜", "💙", "💚", "🧡",
  "❤️", "🖤", "🤍", "💛", "💗", "💝", "💖", "💞", "💕", "♥️",
  "👾", "🤖", "👻", "💀", "🎃", "👽", "🛸", "🚀", "✨", "💫",
  "🎪", "🎠", "🎡", "🎢", "🏰", "🗿", "🎯", "🎲", "🧩", "🎱",
  // Лица
  "😎", "🤩", "😈", "👹", "🤡", "💩", "🥶", "🥵", "🤯", "😍",
  "🥺", "😤", "🫠", "🫡", "🫣", "🫢", "🤭", "😶‍🌫️", "🫥", "🤪",
  // Жесты
  "👋", "✌️", "🤘", "🤙", "👊", "✊", "🫶", "🙌", "👏", "🤝",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function EmojiPicker({ value, onChange, isOpen, onToggle }: EmojiPickerProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="w-16 h-16 bg-secondary ring-1 ring-border rounded-xl text-3xl flex items-center justify-center hover:ring-accent/30 transition-all hover:scale-105"
      >
        {value || "🐊"}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-2 z-50 bg-card ring-1 ring-border rounded-xl p-3 shadow-xl w-[320px] max-h-[300px] overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2 font-medium">🎨 Выберите аватар</p>
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_LIST.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(emoji);
                    onToggle();
                  }}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-base hover:bg-secondary transition-colors ${
                    value === emoji ? "bg-secondary ring-1 ring-accent/30" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
