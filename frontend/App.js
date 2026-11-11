import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StatusBar,
  Image,
  Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { YEARS, VEHICLE_MAKES } from './vehiclesData';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://drivelogic-app.onrender.com';

export default function App() {
  const [activeTab, setActiveTab] = useState('mechanic'); // 'mechanic' | 'shops' | 'consulting'

  // Vehicle state
  const [vehicle, setVehicle] = useState({
    year: '2020',
    make: 'BMW',
    model: '3 Series',
    mileage: '45,000'
  });
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedMakeObj, setSelectedMakeObj] = useState(
    VEHICLE_MAKES.find((m) => m.name === 'BMW') || VEHICLE_MAKES[3]
  );
  const [tempYear, setTempYear] = useState('2020');
  const [tempMake, setTempMake] = useState('BMW');
  const [tempModel, setTempModel] = useState('3 Series');
  const [customModel, setCustomModel] = useState('');
  const [tempMileage, setTempMileage] = useState('45,000');
  const [makeSearch, setMakeSearch] = useState('');

  // Diagnostic Chat & History state
  const [messages, setMessages] = useState([]);
  const [symptomText, setSymptomText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState(null);

  // Specialist shops state
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(false);

  // Consultation form state
  const [consultName, setConsultName] = useState('');
  const [consultContact, setConsultContact] = useState('');
  const [consultSummary, setConsultSummary] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);

  const scrollViewRef = useRef();

  const quickSymptoms = [
    { label: 'Brake Grinding', key: 'brake_grind' },
    { label: 'Check Engine Light', key: 'check_engine' },
    { label: 'Clicking / Won\'t Start', key: 'wont_start' },
    { label: 'Engine Overheating', key: 'overheating' },
    { label: 'Transmission Slipping', key: 'trans_slip' },
    { label: 'Vibration at Highway Speed', key: 'vibration' },
  ];

  const followUpSuggestions = [
    'Can I drive it home safely?',
    'What is a fair labor cost?',
    'What tools do I need to DIY?',
    'What questions should I ask the shop?'
  ];

  const specialties = [
    'All',
    'Brakes & Suspension',
    'Transmission',
    'Engine Diagnostics',
    'Auto Electrical',
    'Tires & Alignment'
  ];

  useEffect(() => {
    fetchShops(selectedSpecialty);
  }, [selectedSpecialty]);

  const toggleSymptom = (label) => {
    if (selectedSymptoms.includes(label)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== label));
    } else {
      setSelectedSymptoms([...selectedSymptoms, label]);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachedPhoto({
          uri: asset.uri,
          base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
        });
      }
    } catch (e) {
      console.log('Image picker error:', e);
      useSamplePhoto();
    }
  };

  const useSamplePhoto = () => {
    setAttachedPhoto({
      uri: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80',
      base64: 'sample_dashboard_photo',
      isSample: true,
    });
  };

  const runDiagnosis = async (customMessage) => {
    const messageToSend = (customMessage || symptomText).trim();
    if (!messageToSend && selectedSymptoms.length === 0 && !attachedPhoto) {
      Alert.alert('Empty Request', 'Please describe a symptom, select one from the quick list, or attach a photo.');
      return;
    }

    const currentPhoto = attachedPhoto;
    const effectiveMessage = messageToSend || (currentPhoto ? 'Visual photo inspection requested.' : selectedSymptoms.join(', '));

    // 1. Append User message immediately to conversation thread
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: effectiveMessage,
      photoUri: currentPhoto?.uri || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    // 2. Clear input fields immediately
    setSymptomText('');
    setAttachedPhoto(null);
    setSelectedSymptoms([]);
    setLoadingDiagnosis(true);

    // Scroll chat to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await fetch(`${BACKEND_URL}/api/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: effectiveMessage,
          vehicle: {
            year: parseInt(vehicle.year) || 2020,
            make: vehicle.make,
            model: vehicle.model,
            mileage: parseInt(vehicle.mileage.replace(/\D/g, '')) || 0,
          },
          symptoms: selectedSymptoms,
          history: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          image_base64: currentPhoto?.base64 || null,
        }),
      });

      if (!response.ok) throw new Error('Diagnosis request failed');
      const data = await response.json();

      // 3. Append Assistant response to conversation
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        diagnosis: data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...updatedHistory, assistantMsg]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Unable to reach the DriveLogic AI Diagnostic server. Please check your internet connection or try again in a few moments.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...updatedHistory, errorMsg]);
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setSymptomText('');
    setAttachedPhoto(null);
    setSelectedSymptoms([]);
  };

  const fetchShops = async (specialty) => {
    setLoadingShops(true);
    try {
      const query = specialty && specialty !== 'All' ? `&specialty=${encodeURIComponent(specialty)}` : '';
      const response = await fetch(`${BACKEND_URL}/api/shops/nearby?lat=38.9072&lon=-77.0369&radius_miles=15${query}`);
      if (!response.ok) throw new Error('Failed to fetch shops');
      const data = await response.json();
      setShops(data.shops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingShops(false);
    }
  };

  const handleFindSpecialistsForDiagnosis = (recommendedSpec) => {
    if (recommendedSpec) {
      setSelectedSpecialty(recommendedSpec);
    }
    setActiveTab('shops');
  };

  const handleBookConsultation = async () => {
    if (!consultName || !consultContact || !consultSummary) {
      Alert.alert('Required Fields', 'Please fill in your name, contact information, and vehicle issue.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/consulting/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: consultName,
          phone: consultContact,
          vehicle_year: parseInt(vehicle.year) || 2020,
          vehicle_make: vehicle.make,
          vehicle_model: vehicle.model,
          issue_summary: consultSummary,
        }),
      });

      if (response.ok) {
        setBookingStatus('success');
        setConsultSummary('');
      } else {
        Alert.alert('Error', 'Booking submission failed. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error submitting consultation request.');
    }
  };

  const openVehiclePicker = () => {
    setTempYear(vehicle.year);
    setTempMake(vehicle.make);
    setTempModel(vehicle.model);
    setTempMileage(vehicle.mileage);
    const foundMake = VEHICLE_MAKES.find((m) => m.name.toLowerCase() === vehicle.make.toLowerCase()) || VEHICLE_MAKES[0];
    setSelectedMakeObj(foundMake);
    setShowVehicleModal(true);
  };

  const saveVehicleSelection = () => {
    const finalModel = tempModel === 'Other' && customModel.trim() ? customModel.trim() : tempModel;
    setVehicle({
      year: tempYear,
      make: tempMake,
      model: finalModel || 'Sedan',
      mileage: tempMileage || '50,000',
    });
    setShowVehicleModal(false);
  };

  const filteredMakes = VEHICLE_MAKES.filter((m) =>
    m.name.toLowerCase().includes(makeSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="car-wrench" size={24} color="#60A5FA" />
          </View>
          <View>
            <Text style={styles.brandTitle}>DriveLogic</Text>
            <Text style={styles.brandSubtitle}>AI Mechanic & Specialist Network</Text>
          </View>
        </View>

        {/* Vehicle Badge */}
        <TouchableOpacity style={styles.vehicleSelectorBadge} onPress={openVehiclePicker}>
          <Ionicons name="car-outline" size={16} color="#93C5FD" />
          <Text style={styles.vehicleBadgeText}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#93C5FD" />
        </TouchableOpacity>
      </View>

      {/* Structured Vehicle Selector Modal */}
      <Modal visible={showVehicleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Active Vehicle</Text>
                <Text style={styles.modalSubtitle}>All brands, models, and years supported</Text>
              </View>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Year Selector */}
              <Text style={styles.fieldLabel}>1. Model Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                {YEARS.map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.pickerChip, tempYear === yr && styles.pickerChipActive]}
                    onPress={() => setTempYear(yr)}
                  >
                    <Text style={[styles.pickerChipText, tempYear === yr && styles.pickerChipTextActive]}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Make / Brand Selector */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>2. Make / Brand</Text>
              <TextInput
                style={styles.searchBar}
                placeholder="Search brand (e.g. BMW, Honda, Toyota, Ford...)"
                placeholderTextColor="#64748B"
                value={makeSearch}
                onChangeText={setMakeSearch}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                {filteredMakes.map((m) => (
                  <TouchableOpacity
                    key={m.name}
                    style={[styles.pickerChip, tempMake === m.name && styles.pickerChipActive]}
                    onPress={() => {
                      setTempMake(m.name);
                      setSelectedMakeObj(m);
                      setTempModel(m.models[0] || 'Other');
                    }}
                  >
                    <Text style={[styles.pickerChipText, tempMake === m.name && styles.pickerChipTextActive]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Model Selector */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                3. {tempMake} Model
              </Text>
              <View style={styles.modelGrid}>
                {selectedMakeObj?.models.map((mod) => (
                  <TouchableOpacity
                    key={mod}
                    style={[styles.modelChip, tempModel === mod && styles.modelChipActive]}
                    onPress={() => setTempModel(mod)}
                  >
                    <Text style={[styles.modelChipText, tempModel === mod && styles.modelChipTextActive]}>
                      {mod}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {tempModel === 'Other' && (
                <TextInput
                  style={[styles.inputBox, { marginTop: 8 }]}
                  placeholder="Enter specific model or trim..."
                  placeholderTextColor="#64748B"
                  value={customModel}
                  onChangeText={setCustomModel}
                />
              )}

              {/* Mileage Input */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>4. Approximate Mileage</Text>
              <TextInput
                style={styles.inputBox}
                placeholder="e.g. 65,000 miles"
                placeholderTextColor="#64748B"
                value={tempMileage}
                onChangeText={setTempMileage}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveVehicleBtn} onPress={saveVehicleSelection}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveVehicleBtnText}>
                  Set Vehicle: {tempYear} {tempMake} {tempModel === 'Other' && customModel ? customModel : tempModel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Content Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* TAB 1: AI MECHANIC CHAT */}
        {activeTab === 'mechanic' && (
          <View>
            <View style={styles.heroBanner}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>AI Mechanic Diagnostic</Text>
                  <Text style={styles.heroDesc}>
                    Interactive diagnostic consultation for your {vehicle.year} {vehicle.make} {vehicle.model}. Ask questions, attach photos, and follow up anytime.
                  </Text>
                </View>
                {messages.length > 0 && (
                  <TouchableOpacity style={styles.resetChatBtn} onPress={handleResetChat}>
                    <Ionicons name="refresh-outline" size={14} color="#94A3B8" />
                    <Text style={styles.resetChatText}>New Diagnosis</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Quick Symptom Chips (only if conversation hasn't started) */}
            {messages.length === 0 && (
              <View>
                <Text style={styles.sectionHeader}>Quick Symptom Check</Text>
                <View style={styles.symptomChipsRow}>
                  {quickSymptoms.map((sym) => {
                    const isSelected = selectedSymptoms.includes(sym.label);
                    return (
                      <TouchableOpacity
                        key={sym.key}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => toggleSymptom(sym.label)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {sym.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Conversation Thread */}
            {messages.map((msg) => (
              <View key={msg.id} style={styles.messageBubbleContainer(msg.role)}>
                {/* User Message */}
                {msg.role === 'user' ? (
                  <View style={styles.userBubble}>
                    {msg.photoUri && (
                      <Image source={{ uri: msg.photoUri }} style={styles.chatImageThumbnail} />
                    )}
                    <Text style={styles.userMessageText}>{msg.content}</Text>
                    <Text style={styles.messageTimestamp}>{msg.timestamp}</Text>
                  </View>
                ) : (
                  /* Assistant Diagnostic Message */
                  <View style={styles.assistantBubble}>
                    <View style={styles.assistantHeader}>
                      <View style={styles.aiAvatar}>
                        <MaterialCommunityIcons name="robot" size={16} color="#60A5FA" />
                      </View>
                      <Text style={styles.aiName}>DriveLogic AI Mechanic</Text>
                      <Text style={styles.messageTimestamp}>{msg.timestamp}</Text>
                    </View>

                    {/* Full Diagnostic Card if diagnosis returned */}
                    {msg.diagnosis && (
                      <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                          <View style={styles.urgencyBadge(msg.diagnosis.urgency)}>
                            <Text style={styles.urgencyBadgeText}>
                              Urgency: {msg.diagnosis.urgency.toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.safetyBadge(msg.diagnosis.safe_to_drive)}>
                            <Ionicons
                              name={msg.diagnosis.safe_to_drive ? 'shield-checkmark' : 'warning'}
                              size={14}
                              color="#FFFFFF"
                              style={{ marginRight: 4 }}
                            />
                            <Text style={styles.safetyBadgeText}>
                              {msg.diagnosis.safe_to_drive ? 'Safe to Drive' : 'Do Not Drive'}
                            </Text>
                          </View>
                        </View>

                        {/* Visual Inspection Box if photo was evaluated */}
                        {msg.diagnosis.image_analysis && (
                          <View style={styles.visualInspectionBox}>
                            <View style={styles.visualInspectionHeader}>
                              <Ionicons name="scan-outline" size={17} color="#60A5FA" style={{ marginRight: 6 }} />
                              <Text style={styles.visualInspectionTitle}>Visual Inspection Analysis</Text>
                            </View>
                            <Text style={styles.visualInspectionText}>{msg.diagnosis.image_analysis}</Text>
                          </View>
                        )}

                        <Text style={styles.analysisNarrative}>{msg.diagnosis.reply}</Text>

                        {/* Probable Issues */}
                        <Text style={styles.subSectionTitle}>Probable Causes</Text>
                        {msg.diagnosis.probable_issues.map((issue, idx) => (
                          <View key={idx} style={styles.issueItem}>
                            <View style={styles.issueTopRow}>
                              <Text style={styles.issueName}>{issue.name}</Text>
                              <View style={styles.probBadge(issue.probability)}>
                                <Text style={styles.probBadgeText}>{issue.probability}</Text>
                              </View>
                            </View>
                            <Text style={styles.issueDetails}>{issue.details}</Text>
                          </View>
                        ))}

                        {/* Repair Cost & Specialty */}
                        <View style={styles.costSpecialtyRow}>
                          <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Estimated Cost</Text>
                            <Text style={styles.statValue}>{msg.diagnosis.estimated_cost_range}</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Specialty Required</Text>
                            <Text style={styles.statValue}>{msg.diagnosis.recommended_specialty}</Text>
                          </View>
                        </View>

                        {/* DIY Parts Sourcing Section */}
                        {msg.diagnosis.parts_sourcing && msg.diagnosis.parts_sourcing.length > 0 && (
                          <View style={styles.partsSourcingContainer}>
                            <View style={styles.partsHeaderRow}>
                              <MaterialCommunityIcons name="toolbox-outline" size={22} color="#F59E0B" style={{ marginRight: 8 }} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.partsSectionTitle}>Source Your Own Parts</Text>
                                <Text style={styles.partsSectionSubtitle}>
                                  Direct links to buy OEM & aftermarket parts for your {vehicle.year} {vehicle.make}:
                                </Text>
                              </View>
                            </View>

                            {msg.diagnosis.parts_sourcing.map((part, idx) => (
                              <View
                                key={idx}
                                style={[styles.partCard, part.recommended_for_make && styles.partCardRecommended]}
                              >
                                <View style={styles.partCardTop}>
                                  <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text style={styles.partRetailerName}>{part.retailer}</Text>
                                      {part.recommended_for_make && (
                                        <View style={styles.recommendedBadge}>
                                          <Text style={styles.recommendedBadgeText}>Best for {vehicle.make}</Text>
                                        </View>
                                      )}
                                    </View>
                                    <Text style={styles.partBadgeTag}>{part.badge}</Text>
                                  </View>
                                </View>

                                <Text style={styles.partDescription}>{part.description}</Text>

                                <TouchableOpacity
                                  style={[styles.sourcePartsBtn, part.recommended_for_make && styles.sourcePartsBtnFeatured]}
                                  onPress={() => Linking.openURL(part.url)}
                                >
                                  <Text style={styles.sourcePartsBtnText}>Search Parts on {part.retailer}</Text>
                                  <Ionicons name="open-outline" size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Questions for Mechanic */}
                        {msg.diagnosis.questions_for_mechanic?.length > 0 && (
                          <View style={styles.questionsContainer}>
                            <Text style={styles.questionsTitle}>Questions to Ask Your Mechanic:</Text>
                            {msg.diagnosis.questions_for_mechanic.map((q, i) => (
                              <View key={i} style={styles.questionBullet}>
                                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#60A5FA" style={{ marginRight: 6, marginTop: 2 }} />
                                <Text style={styles.questionText}>{q}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Action button: Find Specialists */}
                        <TouchableOpacity
                          style={styles.actionSpecialistsBtn}
                          onPress={() => handleFindSpecialistsForDiagnosis(msg.diagnosis.recommended_specialty)}
                        >
                          <Ionicons name="location-sharp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={styles.actionSpecialistsBtnText}>
                            Find {msg.diagnosis.recommended_specialty} Shops Nearby
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}

            {/* Loading Indicator inside chat */}
            {loadingDiagnosis && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#60A5FA" style={{ marginRight: 8 }} />
                <Text style={styles.loadingBubbleText}>AI Mechanic is analyzing symptoms & specs...</Text>
              </View>
            )}

            {/* Quick Follow-up Chips (if chat has messages and not loading) */}
            {messages.length > 0 && !loadingDiagnosis && (
              <View style={styles.followUpChipsContainer}>
                <Text style={styles.followUpHeader}>Suggested Follow-ups:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {followUpSuggestions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.followUpChip}
                      onPress={() => runDiagnosis(suggestion)}
                    >
                      <Text style={styles.followUpChipText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Interactive Chat Input Box (Always resets after sending) */}
            <View style={styles.inputContainer}>
              {/* Photo Attachment preview */}
              {attachedPhoto && (
                <View style={styles.attachedPhotoContainer}>
                  <Image source={{ uri: attachedPhoto.uri }} style={styles.attachedThumbnail} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.photoAttachedTitle}>
                      {attachedPhoto.isSample ? 'Sample Photo Attached' : 'Photo Attached'}
                    </Text>
                    <Text style={styles.photoAttachedSub}>Will be analyzed for visual mechanical faults</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAttachedPhoto(null)} style={styles.removePhotoBtn}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    messages.length > 0
                      ? 'Ask a follow-up question (e.g. Can I drive it home?)...'
                      : 'Describe symptoms, strange noises, warning lights, or OBD codes...'
                  }
                  placeholderTextColor="#64748B"
                  multiline
                  value={symptomText}
                  onChangeText={setSymptomText}
                />

                <TouchableOpacity
                  style={[styles.sendBtn, (!symptomText.trim() && selectedSymptoms.length === 0 && !attachedPhoto) && styles.sendBtnDisabled]}
                  onPress={() => runDiagnosis()}
                  disabled={loadingDiagnosis}
                >
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Photo attachment buttons */}
              {!attachedPhoto && (
                <View style={styles.photoActionRow}>
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                    <Ionicons name="camera-outline" size={17} color="#60A5FA" style={{ marginRight: 6 }} />
                    <Text style={styles.addPhotoBtnText}>Attach Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.samplePhotoBtn} onPress={useSamplePhoto}>
                    <Ionicons name="image-outline" size={15} color="#94A3B8" style={{ marginRight: 4 }} />
                    <Text style={styles.samplePhotoBtnText}>Sample Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 2: SPECIALIST SHOPS */}
        {activeTab === 'shops' && (
          <View>
            <View style={styles.heroBanner}>
              <Text style={styles.heroTitle}>Specialist Shop Network</Text>
              <Text style={styles.heroDesc}>
                Vetted mechanic shops and specialized diagnostic technicians sorted by rating & proximity.
              </Text>
            </View>

            {/* Specialty Filter Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {specialties.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[styles.filterChip, selectedSpecialty === spec && styles.filterChipActive]}
                  onPress={() => setSelectedSpecialty(spec)}
                >
                  <Text style={[styles.filterChipText, selectedSpecialty === spec && styles.filterChipTextActive]}>
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Shop Cards */}
            {loadingShops ? (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.shopList}>
                {shops.map((shop) => (
                  <View key={shop.id} style={styles.shopCard}>
                    <View style={styles.shopHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.shopName}>{shop.name}</Text>
                        <Text style={styles.shopAddress}>{shop.address}</Text>
                      </View>
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={styles.ratingText}>{shop.rating}</Text>
                        <Text style={styles.reviewCount}>({shop.review_count})</Text>
                      </View>
                    </View>

                    <View style={styles.specialtiesTagsRow}>
                      {shop.specialties.map((tag, idx) => (
                        <View key={idx} style={styles.tagBadge}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.shopFooter}>
                      <View style={styles.distanceBadge}>
                        <Ionicons name="navigate-outline" size={14} color="#94A3B8" style={{ marginRight: 4 }} />
                        <Text style={styles.distanceText}>{shop.distance_miles} miles away</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => Linking.openURL(`tel:${shop.phone}`)}
                      >
                        <Ionicons name="call" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.callButtonText}>Contact Shop</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: DRIVELOGIC CONSULTING */}
        {activeTab === 'consulting' && (
          <View>
            <View style={styles.heroBanner}>
              <Text style={styles.heroTitle}>DriveLogic Vehicle Consulting</Text>
              <Text style={styles.heroDesc}>
                Independent, unbiased expert automotive consulting. We review repair quotes, guide major buying decisions, and protect your wallet.
              </Text>
            </View>

            <View style={styles.consultOfferCard}>
              <View style={styles.consultFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={styles.consultFeatureText}>Quote Auditing: Never get overcharged for auto repairs</Text>
              </View>
              <View style={styles.consultFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={styles.consultFeatureText}>Pre-Purchase Inspections & Buying Strategy</Text>
              </View>
              <View style={styles.consultFeature}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={styles.consultFeatureText}>1-on-1 Consultation with Certified Master Technicians</Text>
              </View>

              <TouchableOpacity
                style={styles.websiteBtn}
                onPress={() => Linking.openURL('https://drivelogic.org')}
              >
                <Ionicons name="globe-outline" size={16} color="#60A5FA" style={{ marginRight: 6 }} />
                <Text style={styles.websiteBtnText}>Visit Website: drivelogic.org</Text>
              </TouchableOpacity>
            </View>

            {/* Booking Form */}
            <View style={styles.bookingCard}>
              <Text style={styles.bookingCardTitle}>Request Expert Consultation</Text>

              {bookingStatus === 'success' ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={36} color="#10B981" />
                  <Text style={styles.successTitle}>Request Submitted!</Text>
                  <Text style={styles.successDesc}>
                    A DriveLogic consultant will contact you shortly with personalized guidance for your {vehicle.make}.
                  </Text>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.bookingInput}
                    placeholder="Full Name"
                    placeholderTextColor="#64748B"
                    value={consultName}
                    onChangeText={setConsultName}
                  />
                  <TextInput
                    style={styles.bookingInput}
                    placeholder="Phone or Email"
                    placeholderTextColor="#64748B"
                    value={consultContact}
                    onChangeText={setConsultContact}
                  />
                  <TextInput
                    style={[styles.bookingInput, { height: 90, textAlignVertical: 'top' }]}
                    placeholder="Describe your situation or repair quote you'd like audited..."
                    placeholderTextColor="#64748B"
                    multiline
                    value={consultSummary}
                    onChangeText={setConsultSummary}
                  />
                  <TouchableOpacity style={styles.submitConsultBtn} onPress={handleBookConsultation}>
                    <Text style={styles.submitConsultBtnText}>Submit Consultation Request</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'mechanic' && styles.navItemActive]}
          onPress={() => setActiveTab('mechanic')}
        >
          <MaterialCommunityIcons
            name="stethoscope"
            size={22}
            color={activeTab === 'mechanic' ? '#3B82F6' : '#94A3B8'}
          />
          <Text style={[styles.navLabel, activeTab === 'mechanic' && styles.navLabelActive]}>
            AI Mechanic
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'shops' && styles.navItemActive]}
          onPress={() => setActiveTab('shops')}
        >
          <Ionicons
            name="map"
            size={22}
            color={activeTab === 'shops' ? '#3B82F6' : '#94A3B8'}
          />
          <Text style={[styles.navLabel, activeTab === 'shops' && styles.navLabelActive]}>
            Specialists
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'consulting' && styles.navItemActive]}
          onPress={() => setActiveTab('consulting')}
        >
          <MaterialCommunityIcons
            name="shield-car"
            size={22}
            color={activeTab === 'consulting' ? '#3B82F6' : '#94A3B8'}
          />
          <Text style={[styles.navLabel, activeTab === 'consulting' && styles.navLabelActive]}>
            Consulting
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topHeader: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  vehicleSelectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '50%',
  },
  vehicleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    marginHorizontal: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horizontalChips: {
    marginBottom: 10,
  },
  pickerChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickerChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  pickerChipText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchBar: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  modelChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modelChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  modelChipText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  modelChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputBox: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  modalFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  saveVehicleBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveVehicleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  heroBanner: {
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  resetChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginLeft: 8,
  },
  resetChatText: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  symptomChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#60A5FA',
  },
  chipText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageBubbleContainer: (role) => ({
    marginBottom: 14,
    alignItems: role === 'user' ? 'flex-end' : 'flex-start',
  }),
  userBubble: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  chatImageThumbnail: {
    width: 140,
    height: 90,
    borderRadius: 8,
    marginBottom: 6,
  },
  messageTimestamp: {
    fontSize: 10,
    color: '#CBD5E1',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  assistantBubble: {
    width: '100%',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  aiName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
    flex: 1,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingBubbleText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  followUpChipsContainer: {
    marginVertical: 10,
  },
  followUpHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  followUpChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  followUpChipText: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    maxHeight: 90,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  attachedPhotoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  attachedThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  photoAttachedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  photoAttachedSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  removePhotoBtn: {
    padding: 4,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  addPhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  addPhotoBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  samplePhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  samplePhotoBtnText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3B82F6',
    marginTop: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  urgencyBadge: (urgency) => ({
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor:
      urgency === 'critical'
        ? '#EF4444'
        : urgency === 'high'
        ? '#F97316'
        : urgency === 'medium'
        ? '#EAB308'
        : '#10B981',
  }),
  urgencyBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  safetyBadge: (safe) => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: safe ? '#059669' : '#DC2626',
  }),
  safetyBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  visualInspectionBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  visualInspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  visualInspectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
  },
  visualInspectionText: {
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  analysisNarrative: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  issueItem: {
    backgroundColor: '#0F172A',
    padding: 9,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  issueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  issueName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  probBadge: (prob) => ({
    backgroundColor: prob === 'High' ? '#7F1D1D' : prob === 'Medium' ? '#78350F' : '#064E3B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  }),
  probBadgeText: {
    color: '#F1F5F9',
    fontSize: 10,
    fontWeight: '600',
  },
  issueDetails: {
    fontSize: 11,
    color: '#94A3B8',
  },
  costSpecialtyRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
  },
  partsSourcingContainer: {
    marginTop: 10,
    marginBottom: 8,
  },
  partsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partsSectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  partCard: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  partCardRecommended: {
    borderColor: '#10B981',
    backgroundColor: '#0F231D',
  },
  partCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  partRetailerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginRight: 6,
  },
  recommendedBadge: {
    backgroundColor: '#065F46',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedBadgeText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '700',
  },
  partBadgeTag: {
    fontSize: 10,
    color: '#F59E0B',
    marginTop: 1,
  },
  partDescription: {
    fontSize: 11,
    color: '#94A3B8',
    marginVertical: 4,
    lineHeight: 15,
  },
  sourcePartsBtn: {
    backgroundColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 4,
  },
  sourcePartsBtnFeatured: {
    backgroundColor: '#059669',
  },
  sourcePartsBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  questionsContainer: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  questionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  questionBullet: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  questionText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 15,
  },
  actionSpecialistsBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  actionSpecialistsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shopList: {
    gap: 12,
  },
  shopCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  shopAddress: {
    fontSize: 12,
    color: '#94A3B8',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  reviewCount: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 2,
  },
  specialtiesTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
  },
  tagBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tagText: {
    fontSize: 11,
    color: '#93C5FD',
  },
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  callButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  consultOfferCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  consultFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  consultFeatureText: {
    color: '#E2E8F0',
    fontSize: 13,
    flex: 1,
  },
  websiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  websiteBtnText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bookingCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  bookingInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 10,
  },
  submitConsultBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  submitConsultBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 8,
    marginBottom: 4,
  },
  successDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navItemActive: {},
  navLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
