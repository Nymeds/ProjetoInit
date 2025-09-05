/* eslint-disable prefer-const */

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../baseComponents/button";

interface ModalAnimadoProps {
  open: boolean;
  onClose: () => void;
}

// Letras + tempos (em ms)
const letraComTempos: { word: string; delay: number }[] = [
  { word: "Daisy,", delay: 1200 },
  { word: "Daisy,", delay: 1200 },
  { word: "give", delay: 450 },
  { word: "me", delay: 450 },
  { word: "your", delay: 300 },
  { word: "answer,", delay: 600 },
  { word: "dooo", delay: 2000 },

  { word: "\n - I'm", delay: 550 },
  { word: "half", delay: 950 },
  { word: "crazy", delay: 700 },
  { word: "all", delay: 650 },
  { word: "for", delay: 650 },
  { word: "the", delay: 550 },
  { word: "love", delay: 500 },
  { word: "of", delay: 400 },
  { word: "youuuu", delay: 2000 },

  { word: "\n - It", delay: 400 },
  { word: "won't", delay: 300 },
  { word: "be", delay: 200 },
  { word: "a", delay: 150 },
  { word: "stylish", delay: 500 },
  { word: "marriage,", delay: 600 },
  { word: "I", delay: 200 },
  { word: "can't", delay: 300 },
  { word: "afford", delay: 500 },
  { word: "a", delay: 150 },
  { word: "carriage,", delay: 600 },

  { word: "\n - But", delay: 400 },
  { word: "you", delay: 300 },
  { word: "will", delay: 250 },
  { word: "look", delay: 250 },
  { word: "sweet", delay: 400 },
  { word: "upon", delay: 250 },
  { word: "the", delay: 150 },
  { word: "seat", delay: 400 },
  { word: "of", delay: 200 },
  { word: "a", delay: 150 },
  { word: "bicycle", delay: 500 },
  { word: "made", delay: 200 },
  { word: "for", delay: 200 },
  { word: "two", delay: 300 },
];

export default function ModalAnimado({ open, onClose }: ModalAnimadoProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [playing, setPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeout = useRef<number | null>(null);
  const introTimeout = useRef<number | null>(null);

  
  const currentWordIndex = useRef(0);
  const letterIndex = useRef(0);

  
  const contentRef = useRef<HTMLDivElement | null>(null);

 
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanup();
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) cleanup();
    return cleanup;
     
  }, [open]);

 
  useEffect(() => {
    if (contentRef.current) {
      // rola suavemente até o final
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedText]);

  const cleanup = () => {
    // parar áudio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // limpar timeouts
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
    if (introTimeout.current) {
      clearTimeout(introTimeout.current);
      introTimeout.current = null;
    }

    // reset estado
    setDisplayedText("");
    setPlaying(false);
    setIsTyping(false);
    currentWordIndex.current = 0;
    letterIndex.current = 0;
  };

  const startTyping = () => {
    if (isTyping) return;
    setIsTyping(true);
    currentWordIndex.current = 0;
    letterIndex.current = 0;

    const letterDelay = 45; // velocidade por letra

    const tick = () => {
      if (!open) {
        setIsTyping(false);
        return;
      }
      if (currentWordIndex.current >= letraComTempos.length) {
        setIsTyping(false);
        return;
      }

      let { word, delay } = letraComTempos[currentWordIndex.current];

      // Se começar com \n, insere quebra antes de digitar a palavra
      if (letterIndex.current === 0 && word.startsWith("\n")) {
        setDisplayedText((prev) => prev + "\n");
        word = word.slice(1);
      }

      if (word.length === 0) {
        currentWordIndex.current++;
        letterIndex.current = 0;
        typingTimeout.current = window.setTimeout(tick, delay);
        return;
      }

      if (letterIndex.current < word.length) {
        const ch = word[letterIndex.current];
        if (typeof ch === "string" && ch.length > 0) {
          setDisplayedText((prev) => prev + ch);
        }
        letterIndex.current++;
        typingTimeout.current = window.setTimeout(tick, letterDelay);
      } else {
        const nextIdx = currentWordIndex.current + 1;
        const nextWordStartsWithNewline =
          letraComTempos[nextIdx] && letraComTempos[nextIdx].word.startsWith("\n");

        if (!nextWordStartsWithNewline) {
          setDisplayedText((prev) => prev + " ");
        }
        currentWordIndex.current++;
        letterIndex.current = 0;
        typingTimeout.current = window.setTimeout(tick, delay);
      }
    };

    tick();
  };

  const startMusic = () => {
    if (playing) return;
    setPlaying(true);

    const audio = new Audio("/daisy-bell-creepy-version.mp3");
    audioRef.current = audio;

    audio.play().catch((error) => {
      console.warn("Erro ao reproduzir áudio:", error);
    });

    introTimeout.current = window.setTimeout(() => {
      startTyping();
    }, 4000);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play();
    else audioRef.current.pause();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
        <motion.div
          className="relative w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden border-4"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            borderColor: "rgba(8,64,32,0.95)",
            background:
              "radial-gradient(ellipse at center, rgba(5,20,12,0.85) 0%, rgba(2,6,4,0.95) 60%)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.6), inset 0 8px 40px rgba(0,255,120,0.02)",
          }}
        >
          {/* Header (bolinhas) */}
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{ background: "#041814", borderBottom: "1px solid rgba(8,64,32,0.85)" }}
          >
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>

            <div className="ml-4 text-sm font-mono text-green-300 select-none">Terminal</div>

            <div className="ml-auto text-xs text-green-500 font-mono select-none">v 0.1</div>
          </div>

          {/* Screen */}
          <div className="relative p-5">
            {/* scanlines overlay */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage:
                  "repeating-linear-gradient(rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px)",
                mixBlendMode: "overlay",
                zIndex: 2,
              }}
            />

            {/* content area with GIF + terminal text */}
            <div className="relative z-10 w-full flex gap-4 items-start">
              {/* GIF (computador girando) */}
              <div className="flex-shrink-0">
                <img
                  src="/77036967_8LcpLVyKWHtvg2H.gif"
                  alt="Computador girando"
                  className="w-36 h-36 object-contain rounded-sm border border-green-900"
                  style={{
                    boxShadow: "0 6px 20px rgba(0,255,120,0.03), inset 0 0 10px rgba(0,0,0,0.4)",
                    background: "linear-gradient(180deg, rgba(0,20,10,0.3), rgba(0,0,0,0.6))",
                  }}
                />
              </div>

              {/* Terminal text box (VT-like) */}
              <div
                ref={contentRef}
                className="flex-1 h-40 overflow-y-auto p-3 rounded-sm"
                style={{
                  background: "linear-gradient(180deg, rgba(1,18,17,0.95), rgba(0,10,8,0.95))",
                  border: "1px solid rgba(20,120,60,0.06)",
                  fontFamily: `'VT323', "Courier New", monospace`,
                }}
              >
                <div
                  className="text-green-400 text-sm leading-relaxed whitespace-pre-wrap break-words"
                  style={{
                    textShadow: "0 0 6px rgba(34,197,94,0.06), 0 0 18px rgba(34,197,94,0.02)",
                    lineHeight: 1.4,
                    fontSize: 14,
                  }}
                >
                  <span className="text-green-300 font-mono">user@vt320:~$ </span>
                  <span>{displayedText}</span>
                  {isTyping && (
                    <span
                      className="terminal-cursor inline-block align-middle ml-1"
                      style={{
                        width: 12,
                        height: 18,
                        display: "inline-block",
                        verticalAlign: "middle",
                        marginLeft: 6,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* controles */}
          <div
            className="flex items-center gap-2 p-4"
            style={{ background: "#031514", borderTop: "1px solid rgba(8,64,32,0.85)" }}
          >
            {!playing ? (
              <Button variant="primary" onClick={startMusic}>
                 🎵
              </Button>
            ) : (
              <Button variant="danger" onClick={toggleAudio}>
                {audioRef.current?.paused === false ? "⏸️ Pausar" : "▶️ Continuar"}
              </Button>
            )}

            <Button variant="secondary" onClick={handleClose}>
              Fechar
            </Button>

            <div className="ml-auto text-xs text-green-300 font-mono select-none">pressione ESC para fechar</div>
          </div>
        </motion.div>
      </div>

      {/* estilos específicos do terminal (font import, keyframes) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

        .terminal-cursor {
          background: linear-gradient(90deg, rgba(34,197,94,0.95), rgba(16,185,129,0.9));
          box-shadow: 0 0 8px rgba(34,197,94,0.18);
          animation: blink-cursor 1s steps(2, start) infinite;
          border-radius: 2px;
        }

        @keyframes blink-cursor {
          0%, 49% { opacity: 1; transform: translateY(0); }
          50%, 100% { opacity: 0; transform: translateY(0); }
        }

        @keyframes crt-flicker {
          0% { opacity: .98; filter: contrast(1) hue-rotate(0deg); }
          50% { opacity: .94; filter: contrast(.98) hue-rotate(-1deg); }
          100% { opacity: .98; filter: contrast(1) hue-rotate(0deg); }
        }
        .text-green-400 { animation: crt-flicker 3.5s infinite; }
      `}</style>
    </>
  );
}
