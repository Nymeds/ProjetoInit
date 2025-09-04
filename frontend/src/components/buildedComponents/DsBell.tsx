/* eslint-disable prefer-const */
 
// src/components/buildedComponents/ModalAnimado.tsx
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

  { word: "\nI'm", delay: 550 },
  { word: "half", delay: 950 },
  { word: "crazy", delay: 700 },
  { word: "all", delay: 650 },
  { word: "for", delay: 650 },
  { word: "the", delay: 550 },
  { word: "love", delay: 500 },
  { word: "of", delay: 400 },
  { word: "youuuu", delay: 2000 },

  { word: "\nIt", delay: 400 },
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

  { word: "\n But", delay: 400 },
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

  // índices controlando a digitação
  const currentWordIndex = useRef(0);
  const letterIndex = useRef(0);

  useEffect(() => {
    if (!open) cleanup();
    return cleanup;
     
  }, [open]);

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
    // proteção: se já estiver digitando, ignora
    if (isTyping) return;

    setIsTyping(true);
    currentWordIndex.current = 0;
    letterIndex.current = 0;

    const letterDelay = 50; // ms entre letras

    const tick = () => {
      // se modal foi fechado no meio, cancela
      if (!open) {
        setIsTyping(false);
        return;
      }

      // fim de todas as palavras
      if (currentWordIndex.current >= letraComTempos.length) {
        setIsTyping(false);
        return;
      }

      let { word, delay } = letraComTempos[currentWordIndex.current];

      // Se a palavra começa com \n, adiciona a quebra primeiro (uma única vez)
      if (letterIndex.current === 0 && word.startsWith("\n")) {
        setDisplayedText((prev) => prev + "\n");
        word = word.slice(1); // remove o \n para a digitação das letras
      }

      // proteção: se a palavra ficou vazia após remover \n, pula pra próxima
      if (word.length === 0) {
        // adicionar espaço só se fizer sentido (aqui não adicionamos)
        currentWordIndex.current++;
        letterIndex.current = 0;
        typingTimeout.current = window.setTimeout(tick, delay);
        return;
      }

      // ensure letterIndex is within bounds
      if (letterIndex.current < word.length) {
        const ch = word[letterIndex.current];
        // checagem extra; se por algum motivo ch for undefined, tratamos como empty
        if (typeof ch === "string" && ch.length > 0) {
          setDisplayedText((prev) => prev + ch);
        }
        letterIndex.current++;
        typingTimeout.current = window.setTimeout(tick, letterDelay);
      } else {
        // final da palavra: adiciona espaço (não adiciona espaço se a próxima palavra começar com \n)
        const nextIdx = currentWordIndex.current + 1;
        const nextWordStartsWithNewline =
          letraComTempos[nextIdx] && letraComTempos[nextIdx].word.startsWith("\n");

        if (!nextWordStartsWithNewline) {
          setDisplayedText((prev) => prev + " ");
        } else {
          // se próximo começa com \n, não adiciona espaço (a quebra será inserida no próximo tick)
        }

        // avança para próxima palavra
        currentWordIndex.current++;
        letterIndex.current = 0;

        // aguarda o delay específico da palavra antes de continuar
        typingTimeout.current = window.setTimeout(tick, delay);
      }
    };

    // inicio imediato
    tick();
  };

  const startMusic = () => {
    if (playing) return;
    setPlaying(true);

    const audio = new Audio("/daisy-bell-creepy-version.mp3");
    audioRef.current = audio;

    audio.play().catch((error) => {
      // falha ao tocar não quebra tudo, apenas loga
      console.warn("Erro ao reproduzir áudio:", error);
    });

    // inicia a digitação após a introdução (ajuste esse tempo se quiser)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        className="bg-background-secondary p-6 rounded-2xl flex flex-col items-center gap-4 shadow-xl max-w-lg w-full mx-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <img
          src="/77036967_8LcpLVyKWHtvg2H.gif"
          alt="GIF"
          className="w-48 h-48 mx-auto rounded-lg"
        />

        {!playing ? (
          <Button variant="primary" onClick={startMusic}>
            Tocar Música 🎵
          </Button>
        ) : (
          <div className="w-full">
            <div className="bg-black/20 p-4 rounded-lg border border-gray-600">
              <div
                className="text-accent-paragraph text-base font-mono leading-relaxed whitespace-pre-wrap min-h-[150px]"
                style={{ fontFamily: "Courier New, monospace" }}
              >
                {displayedText}
                {isTyping && <span className="animate-pulse">|</span>}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {playing && (
            <Button variant="danger" onClick={toggleAudio}>
              {audioRef.current?.paused === false ? "⏸️ Pausar" : "▶️ Continuar"}
            </Button>
          )}

          <Button variant="secondary" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
