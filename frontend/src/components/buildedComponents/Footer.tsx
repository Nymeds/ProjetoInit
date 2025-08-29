// src/components/buildedComponents/Footer.tsx
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-background-secondary/80 backdrop-blur-md px-6 py-0.4 flex items-center justify-between shadow-inner z-50">
      <motion.img
        src="/77036967_8LcpLVyKWHtvg2H.gif"
        alt="GIF animado"
        className="w-12 h-12"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
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
  );
}
