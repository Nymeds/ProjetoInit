 
/* eslint-disable prefer-const */

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../baseComponents/button";

interface ModalAnimadoProps {
  open: boolean;
  onClose: () => void;
}

// --- Texto original (Daisy) ---
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

// --- Refrão completo de Evidências ---
const evidenciasComTempos: { word: string; delay: number }[] = [
  { word: "♪", delay: 600 },
  { word: "\n - E", delay: 300 },
  { word: "nessa", delay: 200 },
  { word: "loucura", delay: 400 },
  { word: "\n - De", delay: 300 },
  { word: "dizer", delay: 250 },
  { word: "que", delay: 150 },
  { word: "não", delay: 100 },
  { word: "te", delay: 300 },
  { word: "queeero", delay: 700 },

  { word: "\n", delay: 100 },
  { word: "- Vou", delay: 200 },
  { word: "negando", delay: 200 },
  { word: "as", delay: 200 },
  { word: "aparencias", delay: 250 },
  { word: "disfarçando", delay: 150 },
  { word: "as", delay: 250 },
  { word: "EVIDENCIAS", delay: 700 },

  { word: "\n", delay: 100 },
  { word: "- Mas", delay: 300 },
  { word: "pra", delay: 200 },
  { word: "que", delay: 200 },
  { word: "viver", delay: 300 },
  { word: "mentindo ??", delay: 300 },

  { word: "♪", delay: 1000 },
];


export default function ModalAnimado({ open, onClose }: ModalAnimadoProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [playing, setPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [volume, setVolume] = useState(0.7); // Novo estado para volume
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeout = useRef<number | null>(null);
  const introTimeout = useRef<number | null>(null);

  const currentWordIndex = useRef(0);
  const letterIndex = useRef(0);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [currentSong, setCurrentSong] = useState<"daisy" | "evidencias" | null>(null);

  // novo estado para tema (vintage / commodore)
  const [theme, setTheme] = useState<'vintage' | 'commodore'>('vintage');

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

  // Novo useEffect para controlar o volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedText]);

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
    if (introTimeout.current) {
      clearTimeout(introTimeout.current);
      introTimeout.current = null;
    }

    setDisplayedText("");
    setPlaying(false);
    setIsTyping(false);
    currentWordIndex.current = 0;
    letterIndex.current = 0;
    setCurrentSong(null);
  };

  const startTypingWithArray = (arr: { word: string; delay: number }[]) => {
    if (isTyping) {
      // Se já está digitando, para a digitação atual antes de iniciar nova
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
      setIsTyping(false);
    }
    
    // Reset completo antes de iniciar
    currentWordIndex.current = 0;
    letterIndex.current = 0;
    setIsTyping(true);

    const letterDelay = 45; // velocidade por letra

    const tick = () => {
      if (!open) {
        setIsTyping(false);
        return;
      }
      if (currentWordIndex.current >= arr.length) {
        setIsTyping(false);
        return;
      }

      let { word, delay } = arr[currentWordIndex.current];

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
        const nextWordStartsWithNewline = arr[nextIdx] && arr[nextIdx].word.startsWith("\n");

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

  const playSong = (song: "daisy" | "evidencias") => {
    // se já está tocando a mesma música, alterna pause/play
    if (currentSong === song && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setPlaying(true);
      } else {
        audioRef.current.pause();
        setPlaying(false);
      }
      return;
    }

    // limpa estado e para qualquer áudio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
    if (introTimeout.current) {
      clearTimeout(introTimeout.current);
      introTimeout.current = null;
    }

    setDisplayedText("");
    setIsTyping(false);
    currentWordIndex.current = 0;
    letterIndex.current = 0;

    const audioPath = song === "daisy" ? "/daisy-bell-creepy-version.mp3" : "/chitaozinho-xororo.mp3";
    // OBS: coloque os mp3 na pasta public do seu app para ficarem acessíveis nesses paths

    const audio = new Audio(audioPath);
    audio.volume = volume; // Aplica o volume atual
    audioRef.current = audio;
    setCurrentSong(song);
    setPlaying(true);

    audio.addEventListener("ended", () => {
      setPlaying(false);
      setCurrentSong(null);
    });

    audio.play().catch((err) => {
      console.warn("Erro ao reproduzir áudio:", err);
      setPlaying(false);
    });

    // sincronização: delays diferentes por música (ajuste conforme precisa)
    if (song === "daisy") {
      // Daisy tinha uma introdução longa na versão original do componente
      introTimeout.current = window.setTimeout(() => startTypingWithArray(letraComTempos), 4000);
    } else {
      // evidências: iniciar quase imediatamente (pequeno delay para garantir autoplay)
      introTimeout.current = window.setTimeout(() => startTypingWithArray(evidenciasComTempos), 600);
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };


  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 px-4 backdrop-blur-sm">
        <motion.div
          className={`relative w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden border-4 ${theme === 'vintage' ? 'vintage-terminal' : 'commodore-terminal'}`}
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            borderColor: theme === 'vintage' ? "rgba(0,255,0,0.6)" : "rgba(100,149,237,0.6)",
            background:
              theme === 'vintage'
                ? "radial-gradient(ellipse at center, rgba(0,20,0,0.95) 0%, rgba(0,8,0,0.98) 60%)"
                : "radial-gradient(ellipse at center, rgba(0,6,20,0.95) 0%, rgba(0,4,8,0.98) 60%)",
            boxShadow: theme === 'vintage' ? "0 30px 80px rgba(0,0,0,0.9), inset 0 4px 40px rgba(0,255,0,0.08)" : "0 30px 80px rgba(0,0,0,0.9), inset 0 4px 40px rgba(100,149,237,0.08)",
            transformStyle: "preserve-3d",
            position: 'relative'
          }}
        >
          {/* Header (bolinhas) */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ 
              background: theme === 'vintage' ? "linear-gradient(180deg, rgba(0,40,0,0.9), rgba(0,20,0,0.95))" : "linear-gradient(180deg, rgba(0,10,20,0.9), rgba(0,6,20,0.95))",
              borderBottom: theme === 'vintage' ? "2px solid rgba(0,255,0,0.3)" : "2px solid rgba(100,149,237,0.25)"
            }}
          >
            <div className="flex gap-2 items-center">
              <span className={`${theme === 'vintage' ? 'terminal-led' : 'commodore-led'} w-3 h-3 ${theme === 'vintage' ? 'rounded-full' : ''} ${theme === 'commodore' ? '' : ''}`} />
              <span className={`${theme === 'vintage' ? 'terminal-led' : 'commodore-led'} w-3 h-3 ${theme === 'vintage' ? 'rounded-full' : ''}`} />
              <span className={`${theme === 'vintage' ? 'terminal-led' : 'commodore-led'} w-3 h-3 ${theme === 'vintage' ? 'rounded-full' : ''}`} />
            </div>

            <div className={`ml-4 text-base font-mono select-none ${theme === 'vintage' ? 'glitch-title terminal-glow' : 'glitch-title-commodore commodore-glow'}`}>
              VINTAGE TERMINAL v2.0 — SYSTEM CORRUPT
            </div>

            <div className="ml-auto text-xs font-mono select-none" style={{ color: theme === 'vintage' ? 'rgb(74 222 128)' : 'rgb(100 149 237)' }}>
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Screen */}
          <div className="relative p-6">
            {/* scanlines overlay */}
            <div
              aria-hidden
              className={theme === 'vintage' ? 'scanlines' : 'scanlines-commodore'}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage:
                  theme === 'vintage'
                    ? "repeating-linear-gradient(rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 1px, transparent 1px, transparent 3px)"
                    : undefined,
                mixBlendMode: "overlay",
                zIndex: 2,
              }}
            />

            {/* content area with GIF + terminal text */}
            <div className="relative z-10 w-full flex gap-6 items-start">
              {/* GIF (computador girando) */}
              <div className="flex-shrink-0">
                <img
                  src="/77036967_8LcpLVyKWHtvg2H.gif"
                  alt="Computador girando"
                  className={`${theme === 'vintage' ? 'w-40 h-40 object-contain rounded-sm border-2 vintage-screen' : 'w-40 h-40 object-contain rounded-sm commodore-screen border-2'}`}
                  style={{
                    borderColor: theme === 'vintage' ? "rgba(0,255,0,0.4)" : "rgba(100,149,237,0.4)",
                    boxShadow: theme === 'vintage' ? "0 8px 25px rgba(0,255,0,0.15), inset 0 0 15px rgba(0,0,0,0.6)" : "0 8px 25px rgba(100,149,237,0.15), inset 0 0 15px rgba(0,0,0,0.6)",
                    background: theme === 'vintage' ? "linear-gradient(180deg, rgba(0,30,0,0.4), rgba(0,0,0,0.8))" : "linear-gradient(180deg, rgba(0,8,20,0.4), rgba(0,0,8,0.8))",
                    transform: "perspective(800px) rotateY(-2deg) rotateX(1deg)",
                    filter: playing ? "hue-rotate(20deg) contrast(1.1) brightness(1.05)" : "contrast(0.9) brightness(0.9)",
                  }}
                />
              </div>

              {/* Terminal text box (VT-like) */}
              <div
                ref={contentRef}
                className={`flex-1 h-48 overflow-y-auto p-4 rounded-sm ${theme === 'vintage' ? 'vintage-terminal-screen' : 'commodore-terminal-screen'} ${isTyping ? 'typing' : ''}`}
                style={{
                  background: theme === 'vintage' ? "linear-gradient(180deg, rgba(0,15,0,0.98), rgba(0,5,0,0.99))" : "linear-gradient(180deg, rgba(0,6,20,0.98), rgba(0,2,8,0.99))",
                  border: `2px solid ${theme === 'vintage' ? 'rgba(0,255,0,0.2)' : 'rgba(100,149,237,0.18)'}`,
                  fontFamily: theme === 'vintage' ? `'VT323', "Courier New", monospace` : `'Courier New', monospace`,
                  boxShadow: theme === 'vintage' ? "inset 0 0 20px rgba(0,255,0,0.1)" : "inset 0 0 20px rgba(100,149,237,0.06)",
                }}
              >
                <div
                  className={`${theme === 'vintage' ? 'text-green-400 terminal-text' : 'commodore-text'} text-base leading-relaxed whitespace-pre-wrap break-words`}
                  style={{
                    textShadow: theme === 'vintage' ? "0 0 8px rgba(0,255,0,0.4), 0 0 20px rgba(0,255,0,0.1)" : "0 0 6px rgba(100,149,237,0.2)",
                    lineHeight: 1.5,
                    fontSize: 16,
                    color: theme === 'vintage' ? 'rgb(110 231 183)' : 'rgb(180 200 255)'
                  }}
                >
                  <span className={`${theme === 'vintage' ? 'text-green-300 terminal-prompt' : 'commodore-prompt' } font-mono`}>{theme === 'vintage' ? 'user@vintage:~$ ' : 'user@commodore:~$ '}</span>
                  <span>{displayedText}</span>
                  {isTyping && (
                    <span
                      className={theme === 'vintage' ? 'terminal-cursor-vintage inline-block align-middle ml-1' : 'commodore-cursor inline-block align-middle ml-1'}
                      style={{
                        width: theme === 'vintage' ? 14 : 10,
                        height: theme === 'vintage' ? 20 : 18,
                        display: 'inline-block',
                        verticalAlign: 'middle',
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
            className="flex items-center gap-3 p-4"
            style={{ 
              background: theme === 'vintage' ? "linear-gradient(180deg, rgba(0,20,0,0.95), rgba(0,8,0,0.98))" : "linear-gradient(180deg, rgba(0,8,20,0.95), rgba(0,4,8,0.98))",
              borderTop: theme === 'vintage' ? "2px solid rgba(0,255,0,0.3)" : "2px solid rgba(100,149,237,0.2)" 
            }}
          >
            <Button variant="primary" onClick={() => playSong("evidencias")} className={`${theme === 'vintage' ? 'terminal-button' : 'commodore-button'}`}>
              🎸
            </Button>

            <Button variant={currentSong === "daisy" ? "danger" : "primary"} onClick={() => playSong("daisy")} className={`${theme === 'vintage' ? 'terminal-button' : 'commodore-button'}`}>
              🔔
            </Button>

            {/* Controlador de Volume */}
            <div className="flex items-center gap-2 ml-4">
              <span className={`text-xs ${theme === 'vintage' ? 'text-green-400' : 'text-[rgb(180,200,255)]'} font-mono`}>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className={theme === 'vintage' ? 'volume-slider' : 'commodore-slider'}
                style={{
                  width: "80px",
                  height: "4px",
                  background: theme === 'vintage' ? "rgba(0,255,0,0.3)" : "rgba(100,149,237,0.2)",
                  outline: "none",
                  borderRadius: "2px",
                }}
              />
              <span className={`text-xs ${theme === 'vintage' ? 'text-green-400' : 'text-[rgb(180,200,255)]'} font-mono`}>{Math.round(volume * 100)}%</span>
            </div>

            <Button variant="secondary" onClick={handleClose} className={`${theme === 'vintage' ? 'terminal-button ml-auto' : 'commodore-button ml-auto'}`}>
              FECHAR
            </Button>

            <Button variant="secondary" onClick={() => setTheme(theme === 'vintage' ? 'commodore' : 'vintage')} className={`${theme === 'vintage' ? 'terminal-button' : 'commodore-button'} ml-2`}>
              {theme === 'vintage' ? 'Commodore Mode' : 'Vintage Mode'}
            </Button>

            <div className={`text-xs font-mono select-none ${theme === 'vintage' ? 'terminal-glow' : 'commodore-glow'}`} style={{ marginLeft: 8 }}>
              PRESS [ESC] TO EXIT
            </div>
          </div>
        </motion.div>
      </div>

      {/* estilos específicos (vintage + commodore) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323:wght@400&display=swap');

        /* ---------- VINTAGE (verde) ---------- */
        .terminal-cursor-vintage {
          background: linear-gradient(90deg, rgba(0,255,0,0.9), rgba(50,255,50,0.8));
          box-shadow: 0 0 12px rgba(0,255,0,0.6);
          animation: blink-cursor-vintage 1.2s steps(2, start) infinite;
          border-radius: 1px;
        }

        @keyframes blink-cursor-vintage {
          0%, 49% { opacity: 1; transform: scale(1); }
          50%, 100% { opacity: 0; transform: scale(0.8); }
        }

        @keyframes crt-flicker-green {
          0% { opacity: 1; filter: contrast(1) brightness(1) hue-rotate(0deg); }
          25% { opacity: 0.95; filter: contrast(1.05) brightness(0.95) hue-rotate(2deg); }
          50% { opacity: 0.98; filter: contrast(0.95) brightness(1.02) hue-rotate(-1deg); }
          75% { opacity: 0.96; filter: contrast(1.02) brightness(0.98) hue-rotate(1deg); }
          100% { opacity: 1; filter: contrast(1) brightness(1) hue-rotate(0deg); }
        }
        
        .terminal-text { 
          animation: crt-flicker-green 4s infinite ease-in-out; 
        }

        @keyframes vintage-glitch {
          0% { transform: translateX(0) translateY(0); }
          10% { transform: translateX(-1px) translateY(0); }
          20% { transform: translateX(1px) translateY(0); }
          30% { transform: translateX(0) translateY(-0.5px); }
          40% { transform: translateX(0.5px) translateY(0.5px); }
          50% { transform: translateX(-0.5px) translateY(-0.5px); }
          60% { transform: translateX(0) translateY(0.5px); }
          70% { transform: translateX(0.5px) translateY(0); }
          80% { transform: translateX(-0.5px) translateY(0); }
          90% { transform: translateX(0) translateY(-0.5px); }
          100% { transform: translateX(0) translateY(0); }
        }
        
        .vintage-terminal-screen.typing { 
          animation: vintage-glitch 2.5s infinite ease-in-out; 
        }

        .terminal-glow {
          text-shadow: 0 0 5px rgba(0,255,0,0.5), 0 0 10px rgba(0,255,0,0.3), 0 0 15px rgba(0,255,0,0.1);
        }

        .terminal-prompt {
          text-shadow: 0 0 8px rgba(0,255,0,0.7);
        }

        .terminal-led {
          animation: led-pulse 2s infinite alternate;
        }
        
        @keyframes led-pulse {
          0% { opacity: 0.6; box-shadow: 0 0 5px rgba(0,255,0,0.3); }
          100% { opacity: 1; box-shadow: 0 0 15px rgba(0,255,0,0.8); }
        }

        .scanlines {
          animation: scanline-move 0.1s linear infinite;
        }
        
        @keyframes scanline-move {
          0% { background-position-y: 0px; }
          100% { background-position-y: 4px; }
        }

        .vintage-screen {
          animation: screen-flicker 5s infinite ease-in-out;
        }
        
        @keyframes screen-flicker {
          0% { 
            filter: contrast(1) brightness(1) saturate(1);
            transform: perspective(800px) rotateY(-2deg) rotateX(1deg);
          }
          50% { 
            filter: contrast(1.1) brightness(0.95) saturate(1.1);
            transform: perspective(800px) rotateY(-1.5deg) rotateX(0.5deg);
          }
          100% { 
            filter: contrast(1) brightness(1) saturate(1);
            transform: perspective(800px) rotateY(-2deg) rotateX(1deg);
          }
        }

        .terminal-button {
          font-family: 'VT323', monospace !important;
          text-shadow: 0 0 5px rgba(0,255,0,0.5);
          border: 1px solid rgba(0,255,0,0.4) !important;
          background: rgba(0,40,0,0.6) !important;
          transition: all 0.2s ease;
        }
        
        .terminal-button:hover {
          background: rgba(0,60,0,0.8) !important;
          box-shadow: 0 0 10px rgba(0,255,0,0.4);
          text-shadow: 0 0 8px rgba(0,255,0,0.8);
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(0,255,0,0.8);
          cursor: pointer;
          box-shadow: 0 0 5px rgba(0,255,0,0.6);
        }
        
        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(0,255,0,0.8);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 5px rgba(0,255,0,0.6);
        }

        .vintage-terminal {
          animation: terminal-border-glow 3s infinite ease-in-out;
        }
        
        @keyframes terminal-border-glow {
          0% { box-shadow: 0 30px 80px rgba(0,0,0,0.9), inset 0 4px 40px rgba(0,255,0,0.08); }
          50% { box-shadow: 0 30px 80px rgba(0,0,0,0.9), inset 0 4px 40px rgba(0,255,0,0.15); }
          100% { box-shadow: 0 30px 80px rgba(0,0,0,0.9), inset 0 4px 40px rgba(0,255,0,0.08); }
        }

        .glitch-title {
          position: relative;
          animation: title-glitch 8s infinite;
        }
        
        @keyframes title-glitch {
          0% { transform: translateX(0); }
          2% { transform: translateX(-2px); }
          4% { transform: translateX(2px); }
          6% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }

        /* ---------- COMMODORE (azul) ---------- */
        .commodore-cursor {
          background: rgba(100,149,237,0.9);
          box-shadow: 0 0 6px rgba(100,149,237,0.6);
          animation: blink-cursor-commodore 1s steps(2, start) infinite;
          border-radius: 0;
        }

        @keyframes blink-cursor-commodore {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        @keyframes commodore-flicker {
          0% { opacity: 1; filter: contrast(1) brightness(1); }
          25% { opacity: 0.92; filter: contrast(1.1) brightness(0.9); }
          50% { opacity: 0.98; filter: contrast(0.9) brightness(1.05); }
          75% { opacity: 0.94; filter: contrast(1.05) brightness(0.95); }
          100% { opacity: 1; filter: contrast(1) brightness(1); }
        }
        
        .commodore-text { 
          animation: commodore-flicker 5s infinite ease-in-out; 
        }

        @keyframes commodore-glitch {
          0% { transform: translateX(0) scaleX(1); }
          5% { transform: translateX(-3px) scaleX(0.98); }
          10% { transform: translateX(3px) scaleX(1.02); }
          15% { transform: translateX(-2px) scaleX(0.99); }
          20% { transform: translateX(2px) scaleX(1.01); }
          25% { transform: translateX(0) scaleX(1); }
          30% { transform: translateX(-1px) scaleX(1); }
          35% { transform: translateX(1px) scaleX(1); }
          40% { transform: translateX(0) scaleX(0.995); }
          45% { transform: translateX(-4px) scaleX(1.03); }
          50% { transform: translateX(4px) scaleX(0.97); }
          55% { transform: translateX(0) scaleX(1); }
          100% { transform: translateX(0) scaleX(1); }
        }
        
        .commodore-terminal-screen.typing { 
          animation: commodore-glitch 3s infinite ease-in-out; 
        }

        .commodore-glow {
          text-shadow: 0 0 3px rgba(100,149,237,0.7), 0 0 6px rgba(100,149,237,0.4);
        }

        .commodore-prompt {
          text-shadow: 0 0 4px rgba(100,149,237,0.8);
        }

        .commodore-led {
          animation: led-pulse-commodore 3s infinite alternate;
          box-shadow: 0 0 4px rgba(100,149,237,0.5);
        }
        
        @keyframes led-pulse-commodore {
          0% { opacity: 0.4; box-shadow: 0 0 2px rgba(100,149,237,0.3); }
          100% { opacity: 1; box-shadow: 0 0 8px rgba(100,149,237,0.9); }
        }

        .scanlines-commodore {
          animation: scanline-move-commodore 0.08s linear infinite;
        }
        
        @keyframes scanline-move-commodore {
          0% { background-position-y: 0px; }
          100% { background-position-y: 2px; }
        }

        .commodore-screen {
          animation: screen-interference 4s infinite ease-in-out;
        }
        
        @keyframes screen-interference {
          0% { 
            filter: contrast(1) brightness(1) saturate(1);
          }
          25% { 
            filter: contrast(1.2) brightness(0.85) saturate(1.3);
          }
          50% { 
            filter: contrast(0.8) brightness(1.1) saturate(0.9);
          }
          75% { 
            filter: contrast(1.15) brightness(0.9) saturate(1.2);
          }
          100% { 
            filter: contrast(1) brightness(1) saturate(1);
          }
        }

        .commodore-button {
          font-family: 'Courier New', monospace !important;
          font-size: 11px !important;
          text-shadow: 0 0 3px rgba(100,149,237,0.6);
          border: 1px solid rgba(100,149,237,0.5) !important;
          background: rgba(0,0,85,0.7) !important;
          transition: all 0.15s ease;
          border-radius: 0 !important;
        }
        
        .commodore-button:hover {
          background: rgba(0,0,139,0.9) !important;
          box-shadow: 0 0 6px rgba(100,149,237,0.5);
          text-shadow: 0 0 5px rgba(100,149,237,0.9);
        }

        .commodore-slider::-webkit-slider-thumb {
          appearance: none;
          width: 8px;
          height: 8px;
          border-radius: 0;
          background: rgba(100,149,237,0.9);
          cursor: pointer;
          box-shadow: 0 0 3px rgba(100,149,237,0.7);
        }
        
        .commodore-slider::-moz-range-thumb {
          width: 8px;
          height: 8px;
          border-radius: 0;
          background: rgba(100,149,237,0.9);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 3px rgba(100,149,237,0.7);
        }

        .commodore-terminal {
          animation: terminal-border-glow-commodore 4s infinite ease-in-out;
          position: relative; /* para pseudo-elemento static-noise */
        }
        
        @keyframes terminal-border-glow-commodore {
          0% { box-shadow: 0 20px 60px rgba(0,0,0,0.9), inset 0 2px 30px rgba(100,149,237,0.1); }
          50% { box-shadow: 0 20px 60px rgba(0,0,0,0.9), inset 0 2px 30px rgba(100,149,237,0.25); }
          100% { box-shadow: 0 20px 60px rgba(0,0,0,0.9), inset 0 2px 30px rgba(100,149,237,0.1); }
        }

        .glitch-title-commodore {
          position: relative;
          animation: title-glitch-commodore 6s infinite;
        }
        
        @keyframes title-glitch-commodore {
          0% { transform: translateX(0); }
          1% { transform: translateX(-4px) scaleX(0.95); }
          2% { transform: translateX(4px) scaleX(1.05); }
          3% { transform: translateX(-2px) scaleX(0.98); }
          4% { transform: translateX(2px) scaleX(1.02); }
          5% { transform: translateX(0) scaleX(1); }
          10% { transform: translateX(-1px); }
          15% { transform: translateX(1px); }
          20% { transform: translateX(0); }
          100% { transform: translateX(0) scaleX(1); }
        }

        @keyframes screen-distortion {
          0% { transform: skew(0deg, 0deg); }
          2% { transform: skew(-0.5deg, 0.2deg); }
          4% { transform: skew(0.3deg, -0.1deg); }
          6% { transform: skew(-0.2deg, 0.3deg); }
          8% { transform: skew(0deg, 0deg); }
          100% { transform: skew(0deg, 0deg); }
        }
        
        .commodore-terminal-screen {
          animation: screen-distortion 7s infinite ease-in-out;
        }

        @keyframes static-noise {
          0% { opacity: 0.02; }
          50% { opacity: 0.05; }
          100% { opacity: 0.02; }
        }
        
        .commodore-terminal::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle, rgba(100,149,237,0.1) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 2px 2px, 3px 3px;
          background-position: 0 0, 1px 1px;
          animation: static-noise 2s infinite;
          pointer-events: none;
          z-index: 1;
        }

      `}</style>
    </>
  );
}
