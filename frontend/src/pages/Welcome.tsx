import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/baseComponents/button";
import Card from "../components/baseComponents/card";
import Footer from "../components/buildedComponents/Footer";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-between min-h-screen items-center bg-gradient-to-b from-bg-900 to-bg-800 text-center px-4 pt-10">
      
      {/* Conteúdo principal */}
      <div className="flex flex-col items-center w-full max-w-lg gap-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full"
        >
          {/* Logo */}
          <motion.img
            src="/welcome.png"
            alt="Logo"
            className="w-32 h-32 mx-auto mb-6 drop-shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />

          {/* Card principal */}
          <Card
            floating
            className="p-8 border-border-primary bg-background-quaternary/70 backdrop-blur-md"
          >
            <h1 className="text-3xl font-extrabold text-heading mb-4">
              Bem-vindo ao meu Dashboard de Tasks ✨
            </h1>

            <p className="mb-3 text-accent-paragraph leading-relaxed">
              Esse projeto é um espaço onde organizo minhas tarefas e treino
              novas funcionalidades. Está em constante evolução — então pode rolar alguns bugs 😅
            </p>

            <p>login de testes : desenvolvedor@dev.com </p>
            <p>senha : 123456</p>

            <p className="text-accent-span text-sm">
              Obrigado por testar e acompanhar o progresso 🚀
            </p>

            <div className="mt-6">
              <Button
                className="bg-accent-brand hover:bg-accent-brand-light text-white px-8 py-3 rounded-xl shadow-lg transition transform hover:scale-105"
                onClick={() => navigate("/login")}
              >
                Começar Agora
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
