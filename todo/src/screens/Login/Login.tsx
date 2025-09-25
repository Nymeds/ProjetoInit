import React, { useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Input } from "../../components/Input";
import CardCircular from "../../components/CircularCard";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const icon = require("../../../assets/icon.png");

//  Schema Yup
const loginSchema = yup.object({
  email: yup
    .string()
    .email("E-mail inválido")
    .required("O e-mail é obrigatório"),
  password: yup
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .required("A senha é obrigatória"),
});

type FormData = yup.InferType<typeof loginSchema>;

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
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setGeneralError(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setGeneralError(err.message || "Erro desconhecido");
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

      {/* Campo Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            placeholder="E-mail"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      {errors.email && (
        <Text style={styles.errorText}>{errors.email.message}</Text>
      )}

      {/* Campo Senha */}
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            placeholder="Senha"
            secureTextEntry={!showPassword}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
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
        )}
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password.message}</Text>
      )}

      {/* Erro geral */}
      {generalError && (
        <Text style={styles.errorText}>{generalError}</Text>
      )}

      {/* Botões */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate("Register" as never)}
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            Ir para Cadastro
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
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
  buttonOutline: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
};
