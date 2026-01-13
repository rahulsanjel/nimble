import React, { useEffect, useState } from "react";
import { 
  View, Text, TextInput, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, StatusBar 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUser, updateProfile, logoutUser } from "../services/auth";
import { CommonActions } from "@react-navigation/native";
import { 
  ChevronLeft, Calendar, Camera, LogOut, CheckCircle2, Circle, User 
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// THEME CONSTANTS
const PRIMARY_NAVY = "#0F172A";
const SLATE_TEXT = "#64748B";
const NEUTRAL_BG = "#F8FAFC";
const BORDER_COLOR = "#E2E8F0";
const WHITE = "#FFFFFF";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState(new Date());
  const [gender, setGender] = useState(""); 
  const [bloodGroup, setBloodGroup] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const genderOptions = [
    { label: "Male", value: "M" },
    { label: "Female", value: "F" },
    { label: "Other", value: "O" }
  ];

  useEffect(() => { fetchUser(); }, []);

  const fetchUser = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFullName(currentUser.full_name || "");
      setPhone(currentUser.phone || "");
      setProfileImage(currentUser.profile_picture || null);
      setGender(currentUser.gender || "");
      setBloodGroup(currentUser.blood_group || "");
      if (currentUser.dob) setDob(new Date(currentUser.dob));
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await logoutUser();
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }));
        } 
      },
    ]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Enable gallery permissions in settings.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };

  const handleSave = async () => {
    try {
      const formattedDob = formatDate(dob);
      const data = { 
        full_name: fullName, 
        phone, 
        dob: formattedDob, 
        gender, 
        blood_group: bloodGroup,
        profile_picture: profileImage 
      };
      
      const result = await updateProfile(data);
      if (result?.errors) {
        Alert.alert("Error", "Update failed.");
      } else {
        Alert.alert("Success", "Profile updated!");
        setEditMode(false);
        fetchUser();
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong.");
    }
  };

  if (!user) return null;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Section */}
{/* Header Section */}
<View style={styles.topHeader}>
  <SafeAreaView edges={['top']}>
    <View style={styles.navBar}>
      <TouchableOpacity 
        onPress={() => {
          if (editMode) {
            setEditMode(false);
          } else {
            // Check if we can go back, otherwise force go to Home
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("MainTabs", { screen: "Home" });
            }
          }
        }} 
        style={styles.iconBtn}
      >
        <ChevronLeft size={24} color={WHITE} />
      </TouchableOpacity>
      
      <Text style={styles.navTitle}>{editMode ? "Edit Profile" : "My Profile"}</Text>
      
      <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
        <LogOut size={20} color={WHITE} />
      </TouchableOpacity>
    </View>

          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }}
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                  <User size={48} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
                </View>
              )}
              
              {editMode && (
                <TouchableOpacity style={styles.cameraBtn} onPress={pickImage} activeOpacity={0.8}>
                  <Camera size={16} color={WHITE} />
                </TouchableOpacity>
              )}
            </View>
            {!editMode && <Text style={styles.headerUserName}>{fullName}</Text>}
            {!editMode && <Text style={styles.headerUserEmail}>{user.email}</Text>}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {editMode ? (
          <View style={styles.formContainer}>
            <InputGroup label="Full Name" value={fullName} onChange={setFullName} />
            <InputGroup label="Phone Number" value={phone} onChange={setPhone} keyboard="phone-pad" />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.radioRow}>
                {genderOptions.map((item) => (
                  <TouchableOpacity key={item.value} style={styles.radioButton} onPress={() => setGender(item.value)}>
                    {gender === item.value ? <CheckCircle2 size={18} color={PRIMARY_NAVY} /> : <Circle size={18} color="#CCC" />}
                    <Text style={[styles.radioText, gender === item.value && styles.radioTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodRow}>
                {bloodGroups.map((bg) => (
                  <TouchableOpacity 
                    key={bg} 
                    style={[styles.bloodChip, bloodGroup === bg && styles.bloodChipActive]}
                    onPress={() => setBloodGroup(bg)}
                  >
                    <Text style={[styles.bloodText, bloodGroup === bg && styles.bloodTextActive]}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputText}>{formatDate(dob)}</Text>
                <Calendar size={18} color={PRIMARY_NAVY} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Update Profile</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display="default"
                onChange={(e, d) => { setShowDatePicker(false); if(d) setDob(d); }}
              />
            )}
          </View>
        ) : (
          <View style={styles.infoCard}>
            <InfoItem label="Full Name" value={fullName} />
            <InfoItem label="Phone" value={phone || "Not set"} />
            <InfoItem label="Birthday" value={formatDate(dob)} />
            <InfoItem label="Gender" value={genderOptions.find(g => g.value === gender)?.label || "Not set"} />
            <InfoItem label="Blood Group" value={bloodGroup || "Not set"} isLast />

            <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
              <Text style={styles.editBtnText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Sub-components
const InputGroup = ({ label, value, onChange, keyboard = "default" }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput 
      style={styles.input} 
      value={value} 
      onChangeText={onChange} 
      keyboardType={keyboard}
      placeholderTextColor={SLATE_TEXT}
    />
  </View>
);

const InfoItem = ({ label, value, isLast }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
    {!isLast && <View style={styles.divider} />}
  </View>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: NEUTRAL_BG },
  topHeader: { 
    backgroundColor: PRIMARY_NAVY, 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32, 
    paddingBottom: 35 
  },
  navBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    alignItems: 'center', 
    marginTop: 10 
  },
  iconBtn: { 
    padding: 10, 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    borderRadius: 14 
  },
  navTitle: { fontSize: 18, fontWeight: '800', color: WHITE },
  avatarWrapper: { alignItems: 'center', marginTop: 20 },
  avatarContainer: { position: 'relative' },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 3, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  placeholderAvatar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: PRIMARY_NAVY, 
    padding: 8, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: WHITE 
  },
  headerUserName: { fontSize: 22, fontWeight: '800', color: WHITE, marginTop: 12 },
  headerUserEmail: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 25, paddingBottom: 100 },
  infoCard: { 
    backgroundColor: WHITE, 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: BORDER_COLOR,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  infoItem: { marginBottom: 12 },
  infoLabel: { fontSize: 11, color: SLATE_TEXT, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 16, color: PRIMARY_NAVY, fontWeight: '700', marginTop: 4 },
  divider: { height: 1, backgroundColor: NEUTRAL_BG, marginTop: 12 },
  editBtn: { 
    backgroundColor: PRIMARY_NAVY, 
    paddingVertical: 16, 
    borderRadius: 16, 
    marginTop: 15, 
    alignItems: 'center' 
  },
  editBtnText: { color: WHITE, fontWeight: '800', fontSize: 15 },
  formContainer: { 
    backgroundColor: WHITE, 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: BORDER_COLOR 
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: PRIMARY_NAVY, marginBottom: 8, marginLeft: 4 },
  input: { 
    backgroundColor: NEUTRAL_BG, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 15, 
    color: PRIMARY_NAVY, 
    borderWidth: 1, 
    borderColor: BORDER_COLOR 
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: NEUTRAL_BG, 
    borderRadius: 12, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: BORDER_COLOR 
  },
  inputText: { fontSize: 15, color: PRIMARY_NAVY, fontWeight: '600' },
  radioRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: NEUTRAL_BG, 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: BORDER_COLOR 
  },
  radioButton: { flexDirection: 'row', alignItems: 'center' },
  radioText: { marginLeft: 6, fontSize: 14, color: SLATE_TEXT, fontWeight: '600' },
  radioTextActive: { color: PRIMARY_NAVY, fontWeight: '800' },
  bloodRow: { flexDirection: 'row' },
  bloodChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: NEUTRAL_BG, 
    marginRight: 10, 
    borderWidth: 1, 
    borderColor: BORDER_COLOR 
  },
  bloodChipActive: { backgroundColor: PRIMARY_NAVY, borderColor: PRIMARY_NAVY },
  bloodText: { color: SLATE_TEXT, fontWeight: '800' },
  bloodTextActive: { color: WHITE },
  saveBtn: { 
    backgroundColor: PRIMARY_NAVY, 
    paddingVertical: 16, 
    borderRadius: 16, 
    marginTop: 10, 
    alignItems: 'center' 
  },
  saveBtnText: { color: WHITE, fontWeight: '800', fontSize: 16 }
});