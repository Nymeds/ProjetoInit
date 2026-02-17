import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SubmitHandler, useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { AppInput } from "../../components/AppInput";
import CardCircular from "../../components/CircularCard";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";
import type { AuthStackParamList } from "../../navigation/AuthStack";
import { registerSchema, RegisterFormData } from "./schema";

const icon = require("../../../assets/icon.png");

export default function Register() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, "Register">>();
  const { colors } = useTheme();
  const { register: authRegister } = useAuth();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema) as Resolver<RegisterFormData>,
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await authRegister(data.name, data.email, data.password);

      setSuccessMessage("Cadastro realizado! Redirecionando para login...");
      reset();
      setTimeout(() => navigation.navigate("Login"), 2000);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Erro ao registrar usuario"));
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

      <AppInput control={control} name="name" label="Nome" placeholder="Digite seu nome" />
      {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

      <AppInput control={control} name="email" label="E-mail" placeholder="Digite seu e-mail" />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

      <AppInput control={control} name="password" label="Senha" placeholder="Digite sua senha" secureTextEntry />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      <AppInput
        control={control}
        name="confirmPassword"
        label="Confirmar Senha"
        placeholder="Repita a senha"
        secureTextEntry
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonOutline, { borderColor: colors.primary }]}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={[styles.buttonText, { color: colors.primary }]}>Voltar para Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  errorText: { color: "red", marginTop: 4, textAlign: "center" },
  successText: { color: "green", marginTop: 4, textAlign: "center" },
  button: { padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12, width: "100%" },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonOutline: { padding: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, marginTop: 10, width: "100%" },
});
