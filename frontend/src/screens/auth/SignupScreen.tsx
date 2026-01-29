import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, SafeAreaView } from "react-native";
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
import { validateDOB, formatDOBForBackend } from "../../utils/dateValidation";

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, "Signup">;

const SignupScreen = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dobError, setDobError] = useState("");
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [buildingError, setBuildingError] = useState("");
  const [proofDoc, setProofDoc] = useState<{name: string; uri: string; base64: string} | null>(null);
  const [proofError, setProofError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const { signup, loading } = useAuthStore();

  const rules = { hasLower: /[a-z]/.test(password), hasUpper: /[A-Z]/.test(password), hasNumber: /\d/.test(password), hasSpecial: /[@!%*?&._-]/.test(password), hasLength: password.length >= 6 };
  const passwordValid = rules.hasLower && rules.hasUpper && rules.hasNumber && rules.hasSpecial && rules.hasLength;
  
  // Private building requires document upload
  const isPrivateBuilding = selectedBuilding?.visibilityType === 'PRIVATE';

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  // Simulate buildings loading completion
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBuildingsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
        setProofError("File too large. Please select a PDF under 5MB.");
        return;
      }
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });
      
      // Check base64 size (roughly 1.37x the original file size)
      const base64Size = base64.length * 0.75; // Approximate original size
      if (base64Size > MAX_FILE_SIZE) {
        setProofError("File too large. Please select a PDF under 5MB.");
        return;
      }
      
      setProofDoc({
        name: asset.name || `document_${Date.now()}.pdf`,
        uri: asset.uri,
        base64: `data:application/pdf;base64,${base64}`,
      });
      setProofError("");
    } catch (error) {
      console.error("Error picking document:", error);
      setProofError("Failed to select document. Please try again.");
    }
  };

  const formatDOB = (d: string) => { if (!d) return null; const [day, month, year] = d.split("/"); return year + "-" + (month?.padStart(2, "0")) + "-" + (day?.padStart(2, "0")); };

  const handleDOBChange = (text: string) => {
    // Format as DD/MM/YYYY
    let formatted = text.replace(/[^\d]/g, "");
    if (formatted.length > 2) formatted = formatted.slice(0, 2) + "/" + formatted.slice(2);
    if (formatted.length > 5) formatted = formatted.slice(0, 5) + "/" + formatted.slice(5);
    formatted = formatted.slice(0, 10);
    
    setDateOfBirth(formatted);
    
    // Validate if complete
    if (formatted.length === 10) {
      const validation = validateDOB(formatted);
      if (!validation.isValid) {
        setDobError(validation.error || "Invalid date");
      } else {
        setDobError("");
      }
    } else {
      setDobError("");
    }
  };

  const handleSignup = async () => {
    // Clear all errors
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setDobError("");
    setAddressError("");
    setBuildingError("");
    setProofError("");

    // Validate name
    if (!name.trim()) {
      setNameError("Full name is required");
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required");
      scrollViewRef.current?.scrollTo({ y: 80, animated: true });
      return;
    }

    // Validate phone
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      scrollViewRef.current?.scrollTo({ y: 160, animated: true });
      return;
    }
    if (phone.length !== 10) {
      setPhoneError("Phone must be 10 digits");
      scrollViewRef.current?.scrollTo({ y: 160, animated: true });
      return;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError("Password is required");
      scrollViewRef.current?.scrollTo({ y: 320, animated: true });
      return;
    }
    if (!passwordValid) {
      setPasswordError("Password must have uppercase, lowercase, number, special char, and 6+ chars");
      scrollViewRef.current?.scrollTo({ y: 320, animated: true });
      return;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Confirm password is required");
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
      return;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
      return;
    }

    // Validate DOB
    if (dateOfBirth.length === 10) {
      const validation = validateDOB(dateOfBirth);
      if (!validation.isValid) {
        setDobError(validation.error || "Invalid date");
        scrollViewRef.current?.scrollTo({ y: 240, animated: true });
        return;
      }
    } else if (dateOfBirth.length > 0) {
      setDobError("Please complete the date in DD/MM/YYYY format");
      scrollViewRef.current?.scrollTo({ y: 240, animated: true });
      return;
    }

    // Validate building
    if (!selectedBuilding) {
      setBuildingError("Building selection is required");
      scrollViewRef.current?.scrollTo({ y: 480, animated: true });
      return;
    }

    // Validate proof doc for private buildings
    if (isPrivateBuilding && !proofDoc) {
      setProofError("Document upload is required for private buildings");
      scrollViewRef.current?.scrollTo({ y: 520, animated: true });
      return;
    }
    
    try {
      await setItem("postAuthRedirect", JSON.stringify({ route: "Main", screen: "Home" }));
      const result = await signup(
        name, 
        email, 
        password, 
        formatDOBForBackend(dateOfBirth), 
        address.trim() || null, 
        phone.trim() || null, 
        null, // buildingCode (legacy)
        proofDoc?.base64 || null,
        selectedBuilding?.id || null // buildingId (new)
      );
      navigation.navigate("VerifyEmail", { email: result.email });
    } catch (e: any) { 
      setEmailError(e.message || "Signup failed. Please try again.");
      scrollViewRef.current?.scrollTo({ y: 80, animated: true });
    }
  };

  const baseValid = name.trim() && email.trim() && passwordValid && confirmPassword === password && selectedBuilding !== null;
  const canSubmit = isPrivateBuilding ? (baseValid && proofDoc !== null) : baseValid;

  return (
    <LinearGradient colors={["#4840a4", "#6b5fb3", "#8b7ec4"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Dark Mode Toggle */}
          <TouchableOpacity style={styles.darkModeToggle}>
            <Ionicons name="moon" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="musical-notes" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your musical journey</Text>
          </View>

          <View style={styles.formCard}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputWrapper, nameError && styles.inputWrapperError]}>
                <Ionicons name="person" size={20} color="#c4b5fd" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#a78bfa"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setNameError("");
                  }}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
                <Ionicons name="mail" size={20} color="#c4b5fd" />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#a78bfa"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputWrapper, phoneError && styles.inputWrapperError]}>
                <Ionicons name="call" size={20} color="#c4b5fd" />
                <TextInput
                  style={styles.input}
                  placeholder="10-digit phone"
                  placeholderTextColor="#a78bfa"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text.replace(/\D/g,"").slice(0,10));
                    setPhoneError("");
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </View>

            {/* Date of Birth Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={[styles.inputWrapper, dobError && styles.inputWrapperError]}>
                <Ionicons name="calendar" size={20} color="#c4b5fd" />
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#a78bfa"
                  value={dateOfBirth}
                  onChangeText={handleDOBChange}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
            </View>

            {/* Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <View style={[styles.inputWrapper, addressError && styles.inputWrapperError, {minHeight: 80}]}>
                <Ionicons name="location" size={20} color="#c4b5fd" style={{marginTop: 12}} />
                <TextInput
                  style={[styles.input, {minHeight: 60}]}
                  placeholder="Enter address"
                  placeholderTextColor="#a78bfa"
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    setAddressError("");
                  }}
                  multiline
                />
              </View>
              {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
            </View>

            {/* Building Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Your Building <Text style={{color: "#ff0000"}}>*</Text></Text>
              {buildingsLoading ? (
                <View style={styles.loadingBuildingContainer}>
                  <ActivityIndicator size="small" color="#c4b5fd" />
                  <Text style={styles.loadingBuildingText}>Loading buildings...</Text>
                </View>
              ) : (
                <BuildingDropdown
                  value={selectedBuilding}
                  onChange={(building) => {
                    setSelectedBuilding(building);
                    setBuildingError("");
                  }}
                  placeholder="Tap to select a building"
                />
              )}
              {buildingError ? <Text style={styles.errorText}>{buildingError}</Text> : null}
            </View>

            {/* Document Upload for Private Buildings */}
            {isPrivateBuilding && (
              <View style={styles.inputGroup}>
                <View style={styles.privateNotice}>
                  <Ionicons name="lock-closed" size={18} color="#f59e0b" />
                  <Text style={styles.privateNoticeText}>
                    This is a private building. Document verification is required.
                  </Text>
                </View>
                <Text style={styles.label}>Upload Building Proof (PDF only)</Text>
                <Text style={styles.hint}>Aadhaar / Electricity Bill / Maintenance Slip (Max 5MB)</Text>
                <TouchableOpacity style={styles.upload} onPress={pickDocument}>
                  <Ionicons name={proofDoc ? "checkmark-circle" : "document-outline"} size={24} color={proofDoc ? "#10b981" : "#c4b5fd"} />
                  <Text style={[styles.uploadTxt, proofDoc && {color:"#10b981"}]}>{proofDoc ? "PDF Selected" : "Tap to Upload PDF"}</Text>
                </TouchableOpacity>
                {proofDoc && <View style={styles.fileRow}><Text style={styles.fileName}>{proofDoc.name}</Text><TouchableOpacity onPress={() => setProofDoc(null)}><Text style={styles.remove}>Remove</Text></TouchableOpacity></View>}
                {proofError ? <Text style={styles.errorText}>{proofError}</Text> : null}
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

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, passwordError && styles.inputWrapperError]}>
                <Ionicons name="lock-closed" size={20} color="#c4b5fd" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#a78bfa"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError("");
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#c4b5fd"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              <View style={{marginTop:8}}>
                <Text style={rules.hasLower ? styles.ok : styles.bad}>{rules.hasLower ? "✓" : "○"} lowercase</Text>
                <Text style={rules.hasUpper ? styles.ok : styles.bad}>{rules.hasUpper ? "✓" : "○"} uppercase</Text>
                <Text style={rules.hasNumber ? styles.ok : styles.bad}>{rules.hasNumber ? "✓" : "○"} number</Text>
                <Text style={rules.hasSpecial ? styles.ok : styles.bad}>{rules.hasSpecial ? "✓" : "○"} special</Text>
                <Text style={rules.hasLength ? styles.ok : styles.bad}>{rules.hasLength ? "✓" : "○"} 6+ chars</Text>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputWrapper, confirmPasswordError && styles.inputWrapperError]}>
                <Ionicons name="lock-closed" size={20} color="#c4b5fd" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#a78bfa"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmPasswordError("");
                  }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#c4b5fd"
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.button, (!name.trim() || !email.trim() || !phone.trim() || !passwordValid || confirmPassword !== password || !selectedBuilding || (isPrivateBuilding && !proofDoc) || loading) && styles.buttonDisabled]}
              disabled={!name.trim() || !email.trim() || !phone.trim() || !passwordValid || confirmPassword !== password || !selectedBuilding || (isPrivateBuilding && !proofDoc) || loading}
              onPress={handleSignup}
            >
              {loading ? (
                <ActivityIndicator color="#4840a4" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  darkModeToggle: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#e9d5ff' },
  formCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  inputWrapperError: { borderColor: '#ff0000' },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16, color: '#fff' },
  errorText: { fontSize: 12, color: '#ff0000', marginTop: 6, fontWeight: '500' },
  hint: { color: '#c4b5fd', fontSize: 12, marginBottom: 8 },
  button: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#4840a4', fontSize: 16, fontWeight: 'bold' },
  ok: { color: '#a7f3d0', fontSize: 12 },
  bad: { color: '#ffffff', fontSize: 12 },
  upload: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderStyle: "dashed" },
  uploadTxt: { fontSize: 15, color: '#c4b5fd', fontWeight: "500" },
  fileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  fileName: { color: '#c4b5fd', fontSize: 12, flex: 1, marginRight: 10 },
  remove: { color: '#ff0000', fontSize: 12, fontWeight: "600" },
  privateNotice: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(245, 158, 11, 0.2)", padding: 12, borderRadius: 10, marginBottom: 12, gap: 8 },
  privateNoticeText: { flex: 1, color: "#fcd34d", fontSize: 13 },
  publicNotice: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(16, 185, 129, 0.2)", padding: 12, borderRadius: 10, marginTop: 12, gap: 8 },
  publicNoticeText: { flex: 1, color: "#a7f3d0", fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: '#e9d5ff' },
  signInLink: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  loadingBuildingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: 10 },
  loadingBuildingText: { fontSize: 14, color: '#c4b5fd', fontWeight: '500' },
});

export default SignupScreen;