import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView, Image, TouchableOpacity,
  Alert, StatusBar, ActivityIndicator, Platform, Modal, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentUser, updateProfile } from "../services/auth";
import {
  ChevronLeft, Camera, User, Phone, Droplet, Calendar,
  CheckCircle2, Circle, ChevronDown, ChevronRight, Edit3,
} from "lucide-react-native";

const INK     = "#0D1B2A";
const BLUE    = "#2563EB";
const BLUE_S  = "#EFF6FF";
const GREEN   = "#059669";
const GREEN_S = "#D1FAE5";
const SLATE   = "#64748B";
const MUTED   = "#94A3B8";
const BORDER  = "#E2E8F0";
const SURFACE = "#F8FAFC";
const WHITE   = "#FFFFFF";

const BLOOD_GROUPS  = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const LAPTOP_IP     = "192.168.1.65";

function FieldRow({ icon, label, value, onPress, editMode }) {
  return (
    <TouchableOpacity
      style={styles.fieldRow}
      onPress={onPress}
      disabled={!editMode || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || "Not set"}</Text>
      </View>
      {editMode && onPress && <ChevronRight size={16} color={MUTED} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const [user,          setUser]          = useState(null);
  const [editMode,      setEditMode]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBloodModal, setShowBloodModal] = useState(false);

  const [fullName,      setFullName]      = useState("");
  const [phone,         setPhone]         = useState("");
  const [gender,        setGender]        = useState("");
  const [bloodGroup,    setBloodGroup]    = useState("");
  const [dob,           setDob]           = useState("");
  const [profileImage,  setProfileImage]  = useState(null);

  useEffect(() => { fetchUser(); }, []);

  const fetchUser = async () => {
    const data = await getCurrentUser();
    if (data) {
      setUser(data);
      setFullName(data.full_name  || "");
      setPhone(data.phone         || "");
      setGender(data.gender       || "");
      setBloodGroup(data.blood_group || "");
      setDob(data.dob             || "");
      if (data.profile_picture) {
        let url = data.profile_picture;
        setProfileImage(url.includes("http")
          ? url.replace(/127\.0\.0\.1|localhost|10\.0\.2\.2/, LAPTOP_IP)
          : `http://${LAPTOP_IP}:8000${url}`);
      }
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!res.canceled) setProfileImage(res.assets[0].uri);
  };

  const handleSave = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("full_name",    fullName);
    fd.append("phone",        phone);
    fd.append("gender",       gender);
    fd.append("blood_group",  bloodGroup);
    if (dob && dob.length > 5) fd.append("dob", dob);
    if (profileImage && (profileImage.startsWith("file") || profileImage.startsWith("content"))) {
      fd.append("profile_picture", { uri: profileImage, name: "profile.jpg", type: "image/jpeg" });
    }
    const result = await updateProfile(fd);
    setLoading(false);
    if (result && !result.errors) {
      Alert.alert("✓ Saved", "Your profile has been updated.");
      setEditMode(false);
      fetchUser();
    } else {
      const msg = typeof result?.errors === "object"
        ? Object.entries(result.errors).map(([k, v]) => `${k}: ${v}`).join("\n")
        : "Please check your connection.";
      Alert.alert("Update Failed", msg);
    }
  };

  const genderLabel = (g) => g === "M" ? "Male" : g === "F" ? "Female" : g === "O" ? "Other" : "Not set";

  if (!user) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={BLUE} />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.navBar}>
            <TouchableOpacity
              onPress={() => editMode ? setEditMode(false) : navigation.goBack()}
              style={styles.navBtn}
            >
              <ChevronLeft size={22} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>{editMode ? "Edit Profile" : "My Profile"}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={() => setEditMode(v => !v)}>
              <Edit3 size={18} color={WHITE} />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={editMode ? pickImage : undefined} activeOpacity={editMode ? 0.7 : 1}>
              <View style={styles.avatarRing}>
                {profileImage
                  ? <Image source={{ uri: profileImage }} style={styles.avatarImg} />
                  : <User size={44} color={WHITE} />}
              </View>
              {editMode && (
                <View style={styles.cameraTag}>
                  <Camera size={14} color={WHITE} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarName}>{fullName || "User"}</Text>
            <View style={[styles.rolePill, user.role === "driver" && styles.rolePillDriver]}>
              <Text style={styles.rolePillTxt}>{user.role === "driver" ? "Driver" : "Passenger"}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Body ── */}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {editMode ? (
          // ── Edit Mode ──
          <View style={styles.card}>
            <Text style={styles.sectionHead}>Personal Info</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
              placeholderTextColor={MUTED}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="98XXXXXXXX"
              placeholderTextColor={MUTED}
            />

            <Text style={styles.inputLabel}>Blood Group</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowBloodModal(true)}>
              <Droplet size={16} color={bloodGroup ? BLUE : MUTED} />
              <Text style={[styles.selectTxt, bloodGroup && styles.selectTxtFilled]}>
                {bloodGroup || "Select blood group"}
              </Text>
              <ChevronDown size={16} color={MUTED} />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowDatePicker(true)}>
              <Calendar size={16} color={dob ? BLUE : MUTED} />
              <Text style={[styles.selectTxt, dob && styles.selectTxtFilled]}>
                {dob || "Select date"}
              </Text>
              <ChevronDown size={16} color={MUTED} />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {[["M", "Male"], ["F", "Female"], ["O", "Other"]].map(([val, lbl]) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.genderBtn, gender === val && styles.genderBtnActive]}
                  onPress={() => setGender(val)}
                >
                  {gender === val ? <CheckCircle2 size={16} color={BLUE} /> : <Circle size={16} color={MUTED} />}
                  <Text style={[styles.genderTxt, gender === val && styles.genderTxtActive]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.saveBtnTxt}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditMode(false)}>
              <Text style={styles.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── View Mode ──
          <View style={styles.card}>
            <Text style={styles.sectionHead}>Personal Info</Text>

            <FieldRow icon={<User size={18} color={BLUE} />}    label="Full Name"    value={fullName}           />
            <View style={styles.separator} />
            <FieldRow icon={<Phone size={18} color={BLUE} />}   label="Phone"        value={phone}              />
            <View style={styles.separator} />
            <FieldRow icon={<Droplet size={18} color={BLUE} />} label="Blood Group"  value={bloodGroup}         />
            <View style={styles.separator} />
            <FieldRow icon={<Calendar size={18} color={BLUE} />}label="Date of Birth" value={dob}              />
            <View style={styles.separator} />
            <FieldRow icon={<User size={18} color={BLUE} />}    label="Gender"       value={genderLabel(gender)} />

            <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
              <Edit3 size={16} color={WHITE} />
              <Text style={styles.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Info */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionHead}>Account</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountVal}>{user.email}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Verified</Text>
            <View style={[styles.verifiedBadge, user.is_verified ? styles.verifiedYes : styles.verifiedNo]}>
              <Text style={[styles.verifiedTxt, { color: user.is_verified ? GREEN : MUTED }]}>
                {user.is_verified ? "Verified" : "Pending"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Blood Group Modal */}
      <Modal visible={showBloodModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowBloodModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Blood Group</Text>
            <FlatList
              data={BLOOD_GROUPS}
              keyExtractor={item => item}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.bloodBtn, bloodGroup === item && styles.bloodBtnActive]}
                  onPress={() => { setBloodGroup(item); setShowBloodModal(false); }}
                >
                  <Text style={[styles.bloodBtnTxt, bloodGroup === item && styles.bloodBtnTxtActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={dob ? new Date(dob) : new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setDob(date.toISOString().split("T")[0]);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SURFACE },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: { backgroundColor: INK, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 32 },
  navBar:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 4, marginBottom: 20 },
  navBtn:   { width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  navTitle: { color: WHITE, fontSize: 17, fontWeight: "800" },

  avatarSection: { alignItems: "center", gap: 10 },
  avatarRing:    { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center", overflow: "hidden", borderWidth: 3, borderColor: "rgba(255,255,255,0.25)" },
  avatarImg:     { width: 96, height: 96, resizeMode: "cover" },
  cameraTag:     { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 10, backgroundColor: BLUE, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: WHITE },
  avatarName:    { color: WHITE, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  rolePill:      { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  rolePillDriver:{ backgroundColor: "rgba(37,99,235,0.35)" },
  rolePillTxt:   { color: WHITE, fontSize: 12, fontWeight: "700" },

  // Body
  body: { padding: 20, paddingBottom: 48 },

  card: {
    backgroundColor: WHITE, borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  sectionHead: { fontSize: 12, fontWeight: "800", color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 },
  separator:   { height: 1, backgroundColor: BORDER, marginVertical: 14 },

  // View mode rows
  fieldRow:    { flexDirection: "row", alignItems: "center", gap: 14 },
  fieldIcon:   { width: 40, height: 40, borderRadius: 13, backgroundColor: BLUE_S, justifyContent: "center", alignItems: "center" },
  fieldLabel:  { fontSize: 11, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue:  { fontSize: 16, fontWeight: "700", color: INK, marginTop: 2 },

  editBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: INK, paddingVertical: 15, borderRadius: 16, marginTop: 20 },
  editBtnTxt: { color: WHITE, fontWeight: "800", fontSize: 16 },

  // Edit mode
  inputLabel:  { fontSize: 12, fontWeight: "700", color: SLATE, marginBottom: 8, marginTop: 4 },
  textInput:   { backgroundColor: SURFACE, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: INK, fontWeight: "600", borderWidth: 1, borderColor: BORDER, marginBottom: 14 },

  selectBtn:    { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: SURFACE, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  selectTxt:    { flex: 1, fontSize: 15, color: MUTED, fontWeight: "600" },
  selectTxtFilled: { color: INK },

  genderRow:     { flexDirection: "row", gap: 10, marginBottom: 22 },
  genderBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12, borderRadius: 13, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  genderBtnActive: { borderColor: BLUE, backgroundColor: BLUE_S },
  genderTxt:     { fontSize: 14, fontWeight: "600", color: MUTED },
  genderTxtActive: { color: BLUE },

  saveBtn:    { backgroundColor: INK, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginBottom: 10 },
  saveBtnTxt: { color: WHITE, fontWeight: "800", fontSize: 16 },
  cancelBtn:  { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt: { color: MUTED, fontWeight: "700", fontSize: 15 },

  // Account section
  accountRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accountLabel: { fontSize: 14, fontWeight: "600", color: SLATE },
  accountVal:   { fontSize: 14, fontWeight: "700", color: INK },
  verifiedBadge:{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  verifiedYes:  { backgroundColor: GREEN_S },
  verifiedNo:   { backgroundColor: SURFACE },
  verifiedTxt:  { fontSize: 12, fontWeight: "800" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:   { backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },
  modalTitle:   { fontSize: 20, fontWeight: "900", color: INK, marginBottom: 20 },

  bloodBtn:      { flex: 1, paddingVertical: 18, borderRadius: 16, backgroundColor: SURFACE, alignItems: "center", borderWidth: 1.5, borderColor: BORDER },
  bloodBtnActive:{ backgroundColor: BLUE_S, borderColor: BLUE },
  bloodBtnTxt:   { fontSize: 18, fontWeight: "800", color: SLATE },
  bloodBtnTxtActive: { color: BLUE },
});