import React, { useState } from "react";
import { View, Text, Button, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Input } from "../../components/Input";
import CardCircular from "../../components/CircularCard";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const icon = require("../../../assets/icon.png");

export default function Login() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const friendlyMessage = (msg: string) => {
    if (msg.includes("Invalid email address")) return "O e-mail informado é inválido";
    if (msg.includes("Too small")) return "A senha deve ter no mínimo 6 caracteres";
    if (msg.includes("Login falhou")) return "Usuário ou senha incorretos";
    return msg;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessages(["Preencha email e senha!"]);
      return;
    }

    try {
      setLoading(true);
      setErrorMessages([]);
      await login(email, password);
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
        <Text style={{ color: colors.text, marginTop: 12 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CardCircular size={100} icon={icon} iconSize={90} />
      <Text style={[styles.title, { color: colors.text }]}>Login</Text>

      <Input placeholder="E-mail" value={email} onChangeText={setEmail} />

      <Input
        placeholder="Senha"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        }
      />

      {errorMessages.length > 0 &&
        errorMessages.map((msg, index) => (
          <Text key={index} style={styles.errorText}>
            {msg}
          </Text>
        ))}

      <View style={{ width: "100%", marginTop: 12 }}>
        <Button title="Entrar" color={colors.primary} onPress={handleLogin} />
      </View>

      <View style={{ width: "80%", marginTop: 14 }}>
        <Button
          title="Ir para Cadastro"
          color={colors.primary}
          onPress={() => navigation.navigate("Register" as never)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  errorText: {
    color: "red",
    marginTop: 4,
    textAlign: "center",
  },
});
