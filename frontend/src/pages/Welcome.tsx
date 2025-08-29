import { Button } from "../components/baseComponents/button";
import { useNavigate } from "react-router-dom";
import Card from "../components/baseComponents/card";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="rounded-lg shadow-lg p-8 flex flex-col items-center space-y-6">
        <img src="/welcome.png" alt="Logo" className="w-40 h-40" />
        <hr className="w-full border-gray-300" />

        <Card className="bg-background-quaternary p-6 border-b-2 border-border-primary text-center">
          <h1 className="text-2xl font-bold mb-2">
            Bem-vindo ao meu projeto de Dashboard!
          </h1>
          <p className="mb-4 text-gray-600">
            Esse projeto é simples mas é algo que estou constantmente tentando melhorar.
            Esse dashboard de Tasks terá mais implementações, então está sujeito a bugs e funcionalidades faltando.
          </p>
          <p> Por favor tenha paciência 😁</p>
        </Card>
        <div >
        <Button
          className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg shadow-md"
          onClick={() => navigate("/login")}
        >
          Ir para Login
        </Button>
        </div>
      </div>
    </div>
  );
}
