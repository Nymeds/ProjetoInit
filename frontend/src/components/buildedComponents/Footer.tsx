// src/components/buildedComponents/Footer.tsx
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import ModalAnimado from "./DsBell"
import footerGif from "../../assets/77036967_8LcpLVyKWHtvg2H.gif";
export default function Footer() {
  const [showModal, setShowModal] = useState(false);
  const clickCount = useRef(0);
  const clickTimeout = useRef<number | null>(null);

  const handleGifClick = () => {
    clickCount.current += 1;

    if (clickCount.current === 3) {
      setShowModal(true);
      resetClicks();
    } else {
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
      clickTimeout.current = window.setTimeout(() => resetClicks(), 800);
    }
  };

  const resetClicks = () => {
    clickCount.current = 0;
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 w-full bg-background-secondary/80 backdrop-blur-md px-6 py-0.4 flex items-center justify-between shadow-inner z-50">
        <motion.img
          src={footerGif}
          alt="GIF animado"
          className="w-12 h-12 cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          onClick={handleGifClick}
        />
        <motion.span
          className="text-accent-paragraph text-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          © MVrafael
        </motion.span>
      </footer>

      {showModal && <ModalAnimado open={showModal} onClose={() => setShowModal(false)} />}
    </>
  );
}
