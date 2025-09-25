import React, { useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Input } from "../../components/Input";
import { useAuth } from "../../context/AuthContext";
import CardCircular from "../../components/CircularCard";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const icon = require("../../../assets/icon.png");

// Schema Yup
const registerSchema = Yup.object().shape({
  name: Yup.string().required("O nome é obrigatório"),
  email: Yup.string().email("E-mail inválido").required("O e-mail é obrigatório"),
  password: Yup.string().min(6, "A senha deve ter no mínimo 6 caracteres").required("A senha é obrigatória"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "As senhas não coincidem")
    .required("Confirme a senha"),
});

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setSuccessMessage("");

      const response = await register(data.name, data.email, data.password);

      if (response?.message === "User registered successfully") {
        setSuccessMessage("Cadastro realizado! Redirecionando para login...");
        reset();
        setTimeout(() => navigation.navigate("Login" as never), 4000);
      }
    } catch (err: any) {
      console.log("Erro ao registrar:", err.message);
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

      {/* Campo Nome */}
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input placeholder="Nome" value={value} onChangeText={onChange} onBlur={onBlur} />
        )}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

      {/* Campo Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input placeholder="E-mail" value={value} onChangeText={onChange} onBlur={onBlur} />
        )}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

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
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={colors.text} />
              </TouchableOpacity>
            }
          />
        )}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      {/* Campo Confirmar Senha */}
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            placeholder="Confirmar Senha"
            secureTextEntry={!showConfirmPassword}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={colors.text} />
              </TouchableOpacity>
            }
          />
        )}
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      {/* Botão */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.buttonOutline, { borderColor: colors.primary }]}
        onPress={() => navigation.navigate("Login" as never)}
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
