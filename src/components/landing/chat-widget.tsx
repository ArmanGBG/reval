"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── Types ───────── */
interface ChatMessage {
  id: number;
  role: "bot" | "user";
  text: string;
}

/* ───────── Canned bot responses ───────── */
const CANNED_RESPONSES: Record<string, string> = {
  "قیمت‌ها":
    "ما سه طرح قیمت‌گذاری داریم: رایگان برای شروع، حرفه‌ای برای دانشجویان جدی، و سازمانی برای مدارس. هر کدوم با دوره آزمایشی رایگان شروع می‌شه! 💰",
  "شروع کار":
    "شروع کار با روال خیلی سادست! فقط ثبت‌نام کن، برنامه درسی‌ات رو انتخاب کن و به محض شروع می‌تونی از قابلیت‌ها استفاده بکنی. 🚀",
};

const DEFAULT_RESPONSE =
  "مرسی از سوالت! 💚 تیم پشتیبانی ما به زودی جواب دقیق می‌دن. در همین حال می‌تونی از بخش سوالات متداول هم استفاده بکنی.";

const QUICK_REPLIES = ["قیمت‌ها", "شروع کار"] as const;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: "bot",
    text: "سلام! 👋 من دستیار روال هستم. چطور می‌تونم کمکت کنم؟",
  },
  {
    id: 2,
    role: "bot",
    text: "می‌تونی درباره امکانات، قیمت‌ها یا شروع کار سوال بکنی.",
  },
];

/* ───────── Spring configs ───────── */
const springExpand = { type: "spring" as const, stiffness: 320, damping: 28 };
const springGentle = { type: "spring" as const, stiffness: 260, damping: 24 };

/* ── Typing indicator dots (defined outside render to satisfy react-hooks/static-components) ── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block size-1.5 rounded-full bg-mint/70"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ───────── Component ───────── */
export function ChatWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showBubble, setShowBubble] = React.useState(false);
  const [stickyCtaVisible, setStickyCtaVisible] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [nextId, setNextId] = React.useState(3);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  /* Show the floating bubble after 5 seconds */
  React.useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  /* Track sticky CTA bar visibility so the chat bubble lifts above it on desktop.
     The sticky bar appears once the hero section is scrolled out of view. */
  React.useEffect(() => {
    const heroEl = document.getElementById("top");
    if (!heroEl) return;
    const io = new IntersectionObserver(
      ([entry]) => setStickyCtaVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(heroEl);
    return () => io.disconnect();
  }, []);

  /* Scroll to bottom on new messages */
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* Focus input when panel opens */
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  /* ── Send message handler ── */
  const sendMessage = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = { id: nextId, role: "user", text: trimmed };
      const afterUser = nextId + 1;
      setNextId(afterUser);
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      // Bot responds after a short "typing" delay
      setTimeout(() => {
        const key = QUICK_REPLIES.find((q) => trimmed.includes(q));
        const botText = key ? CANNED_RESPONSES[key] : DEFAULT_RESPONSE;
        const botMsg: ChatMessage = { id: afterUser, role: "bot", text: botText };
        setNextId((n) => n + 1);
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 900 + Math.random() * 600);
    },
    [nextId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  return (
    <AnimatePresence>
      {showBubble && (
        <motion.div
          key="chat-widget-root"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={springGentle}
          className={cn(
            "fixed left-6 z-40 flex flex-col items-start transition-[bottom] duration-300 ease-out",
            stickyCtaVisible ? "bottom-24 lg:bottom-24" : "bottom-6",
          )}
          dir="rtl"
        >
          {/* ───── Chat Panel ───── */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="chat-panel"
                initial={{ opacity: 0, y: 20, scale: 0.85, transformOrigin: "bottom left" }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.85 }}
                transition={springExpand}
                className="mb-4 w-[calc(100vw-3rem)] max-w-[360px] overflow-hidden rounded-2xl border border-border/60 surface"
                style={{
                  backdropFilter: "blur(24px) saturate(140%)",
                  WebkitBackdropFilter: "blur(24px) saturate(140%)",
                }}
              >
                {/* ── Header ── */}
                <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-mint/15">
                    <Bot className="size-4.5 text-mint" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">پشتیبانی روال</p>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint/50" />
                        <span className="relative inline-flex size-2 rounded-full bg-mint" />
                      </span>
                      <span className="text-[11px] text-mint/80">آنلاین</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
                    aria-label="بستن چت"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* ── Messages area ── */}
                <div className="flex max-h-72 min-h-48 flex-col gap-3 overflow-y-auto p-4 scrollbar-thin">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {msg.role === "bot" && (
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mint/10">
                          <Bot className="size-3.5 text-mint/80" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-[1.8] ${
                          msg.role === "bot"
                            ? "rounded-br-sm bg-foreground/[0.06] text-foreground/90"
                            : "rounded-bl-sm bg-mint/90 text-[#06120c]"
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.role === "user" && (
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mint/20">
                          <User className="size-3.5 text-mint" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="flex items-end gap-2"
                      >
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mint/10">
                          <Bot className="size-3.5 text-mint/80" />
                        </div>
                        <div className="rounded-2xl rounded-br-sm bg-foreground/[0.06]">
                          <TypingDots />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* ── Quick replies ── */}
                <div className="flex flex-wrap gap-2 border-t border-border/30 px-4 pt-3 pb-2">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="rounded-full border border-mint/25 bg-mint/[0.07] px-3 py-1.5 text-[12px] text-mint transition-all duration-200 hover:border-mint/50 hover:bg-mint/15 hover:scale-[1.04] active:scale-95"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* ── Input ── */}
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 border-t border-border/40 px-4 py-3"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="پیامت رو بنویس..."
                    className="flex-1 rounded-xl border border-border/50 bg-foreground/[0.04] px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-mint/40 focus:bg-foreground/[0.06]"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex size-9 items-center justify-center rounded-xl bg-mint text-[#06120c] shadow-[0_4px_16px_-4px_var(--mint)] transition-all duration-200 hover:brightness-110 hover:shadow-[0_6px_20px_-4px_var(--mint-bright)] disabled:opacity-30 disabled:shadow-none disabled:hover:brightness-100 active:scale-90"
                    aria-label="ارسال پیام"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ───── Floating Bubble Button ───── */}
          <motion.button
            onClick={() => setIsOpen((prev) => !prev)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            animate={
              isOpen
                ? { rotate: 0 }
                : {
                    y: [0, -6, 0],
                    transition: {
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    },
                  }
            }
            className="group relative flex size-14 items-center justify-center rounded-full bg-mint shadow-[0_8px_32px_-6px_var(--mint),0_0_0_1px_color-mix(in_oklch,var(--mint)_30%,transparent)] transition-colors duration-300 hover:shadow-[0_12px_40px_-6px_var(--mint-bright),0_0_0_1px_color-mix(in_oklch,var(--mint-bright)_40%,transparent)]"
            aria-label={isOpen ? "بستن چت" : "باز کردن چت پشتیبانی"}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.span
                  key="close-icon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <X className="size-5 text-[#06120c]" />
                </motion.span>
              ) : (
                <motion.span
                  key="chat-icon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <MessageCircle className="size-5 text-[#06120c]" />
                </motion.span>
              )}
            </AnimatePresence>

            {/* Unread badge — hidden when chat is open */}
            {!isOpen && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.8 }}
                className="absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_2px_8px_-2px_rgba(239,68,68,0.5)]"
              >
                ۱
              </motion.span>
            )}

            {/* Pulse ring animation when closed */}
            {!isOpen && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-mint/40"
                animate={{
                  scale: [1, 1.4],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 2,
                }}
              />
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
