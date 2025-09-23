import React, { useState, useEffect } from "react";
import { View, Text, Button, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Input } from "../../components/Input";
import { useAuth } from "../../context/AuthContext";
import CardCircular from "../../components/CircularCard";
import { Ionicons } from "@expo/vector-icons";

const icon = require("../../../assets/icon.png");

export default function Register() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const friendlyMessage = (msg: string) => {
    if (msg.includes("Invalid email address")) return "O e-mail informado é inválido";
    if (msg.includes("Too small")) return "A senha deve ter no mínimo 6 caracteres";
    if (msg.includes("409") || msg.includes("Request failed with status code 409")) return "Esse e-mail já está cadastrado";
    return msg;
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessages(["Preencha todos os campos!"]);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessages(["As senhas não coincidem!"]);
      return;
    }

    try {
      setLoading(true);
      setErrorMessages([]);
      setSuccessMessage("");

      
      const response = await register(name, email, password);

      
      if (response?.message === "User registered successfully") {
        setSuccessMessage("Cadastro realizado! Redirecionando para login...");
        
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      
        setTimeout(() => navigation.navigate("Login" as never), 4000);
      } else {
        setErrorMessages(["Erro desconhecido"]);
      }

    } catch (err: any) {
      const messages = err.message ? err.message.split("\n").map(friendlyMessage) : ["Erro desconhecido"];
      setErrorMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 12 }}>Processando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CardCircular size={100} icon={icon} iconSize={90} />
      <Text style={[styles.title, { color: colors.text }]}>Cadastro</Text>

      {errorMessages.length > 0 &&
        errorMessages.map((msg, idx) => (
          <Text key={idx} style={styles.errorText}>
            {msg}
          </Text>
        ))}

      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Input placeholder="Nome" value={name} onChangeText={setName} />
      <Input placeholder="E-mail" value={email} onChangeText={setEmail} />

      <Input
        placeholder="Senha"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <Input
        placeholder="Confirmar Senha"
        secureTextEntry={!showConfirmPassword}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        rightIcon={
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <View style={{ width: "100%", marginTop: 12 }}>
        <Button title="Cadastrar" color={colors.primary} onPress={handleRegister} />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button title="Voltar para Login" color={colors.primary} onPress={() => navigation.navigate("Login" as never)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  errorText: { color: "red", marginTop: 4, textAlign: "center" },
  successText: { color: "green", marginTop: 4, textAlign: "center" },
});
