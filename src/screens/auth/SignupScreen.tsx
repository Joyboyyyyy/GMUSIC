import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useAuthStore } from "../../store/authStore";
import { AuthStackParamList } from "../../navigation/types";
import { setItem } from "../../utils/storage";
import BuildingDropdown, { Building } from "../../components/BuildingDropdown";

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, "Signup">;

const SignupScreen = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [proofDoc, setProofDoc] = useState<{name: string; uri: string; base64: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, loading } = useAuthStore();

  const rules = { hasLower: /[a-z]/.test(password), hasUpper: /[A-Z]/.test(password), hasNumber: /\d/.test(password), hasSpecial: /[@!%*?&._-]/.test(password), hasLength: password.length >= 6 };
  const passwordValid = rules.hasLower && rules.hasUpper && rules.hasNumber && rules.hasSpecial && rules.hasLength;
  
  // Private building requires document upload
  const isPrivateBuilding = selectedBuilding?.visibilityType === 'PRIVATE';

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      
      if (result.canceled || !result.assets?.[0]) return;
      
      const asset = result.assets[0];
      
      // Check file size
      if (asset.size && asset.size > MAX_FILE_SIZE) {
        Alert.alert("File Too Large", "Please select a PDF file under 5MB.");
        return;
      }
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });
      
      // Check base64 size (roughly 1.37x the original file size)
      const base64Size = base64.length * 0.75; // Approximate original size
      if (base64Size > MAX_FILE_SIZE) {
        Alert.alert("File Too Large", "Please select a PDF file under 5MB.");
        return;
      }
      
      setProofDoc({
        name: asset.name || `document_${Date.now()}.pdf`,
        uri: asset.uri,
        base64: `data:application/pdf;base64,${base64}`,
      });
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to select document. Please try again.");
    }
  };

  const formatDOB = (d: string) => { if (!d) return null; const [day, month, year] = d.split("/"); return year + "-" + (month?.padStart(2, "0")) + "-" + (day?.padStart(2, "0")); };

  const handleSignup = async () => {
    try {
      await setItem("postAuthRedirect", JSON.stringify({ route: "Main", screen: "Home" }));
      const result = await signup(
        name, 
        email, 
        password, 
        formatDOB(dateOfBirth), 
        address.trim() || null, 
        phone.trim() || null, 
        null, // buildingCode (legacy)
        proofDoc?.base64 || null,
        selectedBuilding?.id || null // buildingId (new)
      );
      navigation.navigate("VerifyEmail", { email: result.email });
    } catch (e: any) { Alert.alert("Signup Failed", e.message || "Please try again."); }
  };

  const baseValid = name.trim() && email.trim() && passwordValid && confirmPassword === password && selectedBuilding !== null;
  const canSubmit = isPrivateBuilding ? (baseValid && proofDoc !== null) : baseValid;

  return (
    <LinearGradient colors={["#5b21b6", "#7c3aed", "#a78bfa"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={{fontSize:56}}>🎵</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.sub}>Start your musical journey today</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Enter your name" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="10-digit phone" placeholderTextColor="#9ca3af" value={phone} onChangeText={(t) => setPhone(t.replace(/\D/g,"").slice(0,10))} keyboardType="phone-pad" maxLength={10} />
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor="#9ca3af" value={dateOfBirth} onChangeText={(t) => { let f=t.replace(/[^\d]/g,""); if(f.length>2)f=f.slice(0,2)+"/"+f.slice(2); if(f.length>5)f=f.slice(0,5)+"/"+f.slice(5); setDateOfBirth(f.slice(0,10)); }} keyboardType="numeric" maxLength={10} />
            <Text style={styles.label}>Address</Text>
            <TextInput style={[styles.input,{minHeight:60}]} placeholder="Enter address" placeholderTextColor="#9ca3af" value={address} onChangeText={setAddress} multiline />
            
            {/* Building Dropdown Section - REQUIRED */}
            <View style={styles.box}>
              <Text style={styles.boxTitle}>🏢 Select Your Building <Text style={{fontWeight:"600",fontSize:13,color:"#fcd34d"}}>*</Text></Text>
              <Text style={styles.boxHint}>Select your building to access courses</Text>
              <BuildingDropdown
                value={selectedBuilding}
                onChange={setSelectedBuilding}
                placeholder="Tap to select a building"
              />
              {!selectedBuilding && <Text style={styles.required}>* Building selection is required</Text>}
            </View>

            {/* Document Upload for Private Buildings */}
            {isPrivateBuilding && (
              <View style={{marginTop:12}}>
                <View style={styles.privateNotice}>
                  <Ionicons name="lock-closed" size={18} color="#f59e0b" />
                  <Text style={styles.privateNoticeText}>
                    This is a private building. Document verification is required.
                  </Text>
                </View>
                <Text style={styles.label}>Upload Building Proof (PDF only)</Text>
                <Text style={styles.hint}>Aadhaar / Electricity Bill / Maintenance Slip (Max 5MB)</Text>
                <TouchableOpacity style={styles.upload} onPress={pickDocument}>
                  <Ionicons name={proofDoc ? "checkmark-circle" : "document-outline"} size={24} color={proofDoc ? "#10b981" : "#7c3aed"} />
                  <Text style={[styles.uploadTxt, proofDoc && {color:"#10b981"}]}>{proofDoc ? "PDF Selected" : "Tap to Upload PDF"}</Text>
                </TouchableOpacity>
                {proofDoc && <View style={styles.fileRow}><Text style={styles.fileName}>{proofDoc.name}</Text><TouchableOpacity onPress={() => setProofDoc(null)}><Text style={styles.remove}>Remove</Text></TouchableOpacity></View>}
                {!proofDoc && <Text style={styles.required}>* Required for private building access</Text>}
              </View>
            )}

            {/* Public Building Notice */}
            {selectedBuilding?.visibilityType === 'PUBLIC' && (
              <View style={styles.publicNotice}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={styles.publicNoticeText}>
                  Public building - No verification required!
                </Text>
              </View>
            )}

            <Text style={styles.label}>Password</Text>
            <View style={styles.passWrap}>
              <TextInput style={[styles.input,{paddingRight:48}]} placeholder="Enter password" placeholderTextColor="#9ca3af" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eye}><Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color="#6b7280" /></TouchableOpacity>
            </View>
            <View style={{marginTop:6}}>
              <Text style={rules.hasLower ? styles.ok : styles.bad}>{rules.hasLower ? "✓" : "○"} lowercase</Text>
              <Text style={rules.hasUpper ? styles.ok : styles.bad}>{rules.hasUpper ? "✓" : "○"} uppercase</Text>
              <Text style={rules.hasNumber ? styles.ok : styles.bad}>{rules.hasNumber ? "✓" : "○"} number</Text>
              <Text style={rules.hasSpecial ? styles.ok : styles.bad}>{rules.hasSpecial ? "✓" : "○"} special</Text>
              <Text style={rules.hasLength ? styles.ok : styles.bad}>{rules.hasLength ? "✓" : "○"} 6+ chars</Text>
            </View>
            <Text style={[styles.label,{marginTop:16}]}>Confirm Password</Text>
            <View style={styles.passWrap}>
              <TextInput style={[styles.input,{paddingRight:48}]} placeholder="Confirm password" placeholderTextColor="#9ca3af" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eye}><Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={22} color="#6b7280" /></TouchableOpacity>
            </View>
            {confirmPassword && confirmPassword !== password && <Text style={styles.err}>Passwords do not match</Text>}
            <TouchableOpacity style={[styles.btn, !canSubmit && {opacity:0.5}]} disabled={!canSubmit || loading} onPress={handleSignup}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Sign Up</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{marginTop:20,alignItems:"center"}} onPress={() => navigation.navigate("Login")}>
              <Text style={{color:"#fff",fontSize:14}}>Already have an account? <Text style={{fontWeight:"bold"}}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  sub: { fontSize: 15, color: "#e9d5ff" },
  form: { width: "100%" },
  label: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 16, color: "#1f2937" },
  hint: { color: "#c4b5fd", fontSize: 12, marginBottom: 8 },
  err: { color: "#fca5a5", fontSize: 12, marginTop: 4 },
  required: { color: "#fcd34d", fontSize: 12, marginTop: 6 },
  box: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 16, marginTop: 16 },
  boxTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  boxHint: { fontSize: 12, color: "#c4b5fd", marginBottom: 12 },
  upload: { backgroundColor: "#fff", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 2, borderColor: "#ddd", borderStyle: "dashed" },
  uploadTxt: { fontSize: 15, color: "#6b7280", fontWeight: "500" },
  fileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  fileName: { color: "#c4b5fd", fontSize: 12, flex: 1, marginRight: 10 },
  remove: { color: "#fca5a5", fontSize: 12, fontWeight: "600" },
  passWrap: { position: "relative", justifyContent: "center" },
  eye: { position: "absolute", right: 12, padding: 6 },
  ok: { color: "#a7f3d0", fontSize: 12 },
  bad: { color: "#ffffff", fontSize: 12 },
  btn: { backgroundColor: "#1f2937", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20 },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  privateNotice: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(245, 158, 11, 0.2)", padding: 12, borderRadius: 10, marginBottom: 12, gap: 8 },
  privateNoticeText: { flex: 1, color: "#fcd34d", fontSize: 13 },
  publicNotice: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(16, 185, 129, 0.2)", padding: 12, borderRadius: 10, marginTop: 12, gap: 8 },
  publicNoticeText: { flex: 1, color: "#a7f3d0", fontSize: 13 },
});

export default SignupScreen;