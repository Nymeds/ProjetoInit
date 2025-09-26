import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { AppInput } from "../../components/AppInput";
import CardCircular from "../../components/CircularCard";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

import { loginSchema, LoginFormData } from "./schema";

const icon = require("../../../assets/icon.png");

export default function Login() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    // @ts-ignore
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoading(true);
    setGeneralError(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
  if (err.response) {
    switch (err.response.status) {
      case 400:
        setGeneralError("E-mail ou senha inválidos.");
        break;
      case 401:
        setGeneralError("Não autorizado. Verifique suas credenciais.");
        break;
      case 500:
        setGeneralError("Erro no servidor. Tente mais tarde.");
        break;
      default:
        setGeneralError("Ocorreu um erro inesperado.");
    }
  } else {
    setGeneralError("Erro de conexão. Verifique sua internet.");
  }
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

      <AppInput
        control={control}
        name="email"
        label="E-mail"
        placeholder="mail@example.br"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

      <AppInput
        control={control}
        name="password"
        label="Senha"
        placeholder="Sua senha"
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.text} />
          </TouchableOpacity>
        }
        secureTextEntry={!showPassword}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      {generalError && <Text style={styles.errorText}>{generalError}</Text>}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          // @ts-ignore
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate("Register" as never)}
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>Ir para Cadastro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  errorText: { color: "red", marginTop: 4, textAlign: "center" },
  buttonContainer: { width: "100%", marginTop: 12 },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonOutline: { padding: 12, borderRadius: 8, alignItems: "center", borderWidth: 1 },
});