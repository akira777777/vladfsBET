"use client";

import { useEffect, useState } from "react";
import { MessageSquare, X, Send, Gift, Flame, Trophy, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";

interface ChatMessage {
  id: string;
  user: string;
  tier?: "VIP" | "DIAMOND" | "MOD" | "PLAYER";
  text: string;
  timestamp: string;
  isRain?: boolean;
  rainAmount?: number;
  rainClaimed?: boolean;
  isBigWin?: boolean;
  bigWinData?: { game: string; amount: string; multiplier: string };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    user: "CryptoWhale_99",
    tier: "DIAMOND",
    text: "Just hit 185x on Gates of Vladfs! Those multiplier orbs are insane ⚡",
    timestamp: "12:40",
  },
  {
    id: "m-2",
    user: "Elena_CasinoMod",
    tier: "MOD",
    text: "Welcome everyone to VladfsBET! Happy spinning today and good luck in the $25k Tournament!",
    timestamp: "12:41",
  },
  {
    id: "m-3",
    user: "RainBot",
    tier: "MOD",
    text: "🌧️ A rain storm has appeared! $100 Demo Credits available for active players!",
    timestamp: "12:42",
    isRain: true,
    rainAmount: 100,
    rainClaimed: false,
  },
  {
    id: "m-4",
    user: "ZeusMaster",
    tier: "VIP",
    text: "Claimed! Thanks RainBot 🙏",
    timestamp: "12:43",
  },
];

export function CommunityChat() {
  const { user, refreshWallet } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [onlineCount, setOnlineCount] = useState(342);

  // Live chat simulation & random big win broadcasts
  useEffect(() => {
    const randomUsers = ["NordicKing", "LuckyApe77", "AeroFlyer", "NeonShadow", "CyberNinja", "GoldDigger"];
    const randomComments = [
      "Aero Crash reached 45x just now! Who held on?",
      "Plinko high risk 170x bucket hit!!",
      "Gonna buy a bonus on Sugar Rush 🍬",
      "Leveling up to Platinum VIP this week!",
      "Good luck on the roulette tables everyone",
    ];

    const chatInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        const u = randomUsers[Math.floor(Math.random() * randomUsers.length)];
        const text = randomComments[Math.floor(Math.random() * randomComments.length)];
        const newMsg: ChatMessage = {
          id: Date.now().toString(),
          user: u,
          tier: Math.random() > 0.6 ? "VIP" : "PLAYER",
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev.slice(-40), newMsg]);
      }
    }, 9000);

    const onlineInterval = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor((Math.random() - 0.48) * 5));
    }, 4000);

    return () => {
      clearInterval(chatInterval);
      clearInterval(onlineInterval);
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      user: user?.email ? user.email.split("@")[0] : "You (Guest)",
      tier: "VIP",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  };

  const handleClaimRain = (id: string, amount: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, rainClaimed: true } : m)),
    );
    void refreshWallet();
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-110 active:scale-95 transition-all"
          title="Open Live Community Chat"
        >
          <MessageSquare className="h-6 w-6 fill-black" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 animate-ping" />
        </button>
      )}

      {/* Slide-in Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 top-16 z-50 flex w-80 sm:w-96 flex-col border-l border-white/10 bg-[#07080C]/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-neutral-950/80">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold text-sm text-white">Community Chat</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                <Users className="h-3 w-3 text-gold" /> {onlineCount}
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-muted-foreground hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => {
              if (m.isRain) {
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/40 p-3 text-center space-y-2 shadow-lg"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-sky-300">
                      <Gift className="h-4 w-4 text-gold" /> CHAT RAIN EVENT
                    </div>
                    <p className="text-xs text-neutral-200">{m.text}</p>
                    <Button
                      size="sm"
                      onClick={() => handleClaimRain(m.id, m.rainAmount || 100)}
                      disabled={m.rainClaimed}
                      className={`h-8 text-xs font-bold ${
                        m.rainClaimed
                          ? "bg-emerald-600/50 text-white"
                          : "bg-gradient-to-r from-gold to-yellow-400 text-black shadow-md hover:brightness-110"
                      }`}
                    >
                      {m.rainClaimed ? "✓ CLAIMED (+$100)" : "CLAIM +$100 CREDITS"}
                    </Button>
                  </div>
                );
              }

              return (
                <div key={m.id} className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {m.tier === "MOD" ? (
                      <span className="rounded bg-red-500/20 px-1 py-0.2 text-[9px] font-black text-red-400 border border-red-500/30">
                        MOD
                      </span>
                    ) : m.tier === "DIAMOND" ? (
                      <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[9px] font-black text-purple-300 border border-purple-500/30">
                        DIAMOND
                      </span>
                    ) : m.tier === "VIP" ? (
                      <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-black text-amber-300 border border-amber-500/30">
                        VIP
                      </span>
                    ) : null}

                    <span className="font-bold text-white/90">{m.user}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{m.timestamp}</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed pl-1">{m.text}</p>
                </div>
              );
            })}
          </div>

          {/* Chat Input Box */}
          <form onSubmit={handleSend} className="border-t border-white/10 p-3 bg-neutral-950/90 flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message to room..."
              className="h-9 text-xs bg-black/50 border-white/10"
            />
            <Button type="submit" size="sm" className="h-9 px-3 bg-gold text-black font-bold">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
