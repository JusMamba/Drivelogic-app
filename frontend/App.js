import React, { useState, useEffect } from 'react';
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
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://drivelogic-app.onrender.com';

export default function App() {
  const [activeTab, setActiveTab] = useState('mechanic'); // 'mechanic' | 'shops' | 'consulting'

  // Vehicle state
  const [vehicle, setVehicle] = useState({
    year: '2019',
    make: 'Honda',
    model: 'Accord',
    mileage: '65,000'
  });
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Diagnostic state
  const [symptomText, setSymptomText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
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

  const quickSymptoms = [
    { label: 'Brake Grinding', key: 'brake_grind' },
    { label: 'Check Engine Light', key: 'check_engine' },
    { label: 'Clicking / Won\'t Start', key: 'wont_start' },
    { label: 'Engine Overheating', key: 'overheating' },
    { label: 'Transmission Slipping', key: 'trans_slip' },
    { label: 'Vibration at Highway Speed', key: 'vibration' },
  ];

  const specialties = [
    'All',
    'Brakes & Suspension',
    'Transmission',
    'Engine Diagnostics',
    'Auto Electrical',
    'Tires & Alignment'
  ];

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

  const runDiagnosis = async (customMessage) => {
    const messageToSend = customMessage || symptomText;
    if (!messageToSend && selectedSymptoms.length === 0 && !attachedPhoto) {
      alert('Please describe a symptom, select one from the quick list, or attach a photo.');
      return;
    }

    setLoadingDiagnosis(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend || (attachedPhoto ? 'Photo visual inspection requested' : selectedSymptoms.join(', ')),
          vehicle: {
            year: parseInt(vehicle.year) || 2019,
            make: vehicle.make,
            model: vehicle.model,
            mileage: parseInt(vehicle.mileage.replace(/\D/g, '')) || 0,
          },
          symptoms: selectedSymptoms,
          image_base64: attachedPhoto?.base64 || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to diagnose');
      const data = await response.json();
      setDiagnosisResult(data);
    } catch (err) {
      console.error(err);
      alert('Unable to connect to DriveLogic API. Please ensure the backend server is running.');
    } finally {
      setLoadingDiagnosis(false);
    }
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
      alert('Please fill in your name, contact information, and issue summary.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/consulting/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: consultName,
          phone: consultContact,
          vehicle_year: parseInt(vehicle.year) || 2019,
          vehicle_make: vehicle.make,
          vehicle_model: vehicle.model,
          issue_summary: consultSummary,
        }),
      });

      if (response.ok) {
        setBookingStatus('success');
        setConsultSummary('');
      } else {
        alert('Booking submission failed. Please try again.');
      }
    } catch (e) {
      alert('Network error submitting consultation request.');
    }
  };

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
        <TouchableOpacity
          style={styles.vehicleSelectorBadge}
          onPress={() => setShowVehicleModal(!showVehicleModal)}
        >
          <Ionicons name="car-outline" size={16} color="#93C5FD" />
          <Text style={styles.vehicleBadgeText}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#93C5FD" />
        </TouchableOpacity>
      </View>

      {/* Vehicle Quick Editor Modal / Card */}
      {showVehicleModal && (
        <View style={styles.vehicleEditCard}>
          <Text style={styles.vehicleEditTitle}>Update Active Vehicle</Text>
          <View style={styles.vehicleInputRow}>
            <TextInput
              style={[styles.smallInput, { flex: 1 }]}
              placeholder="Year"
              placeholderTextColor="#64748B"
              value={vehicle.year}
              onChangeText={(t) => setVehicle({ ...vehicle, year: t })}
            />
            <TextInput
              style={[styles.smallInput, { flex: 2 }]}
              placeholder="Make"
              placeholderTextColor="#64748B"
              value={vehicle.make}
              onChangeText={(t) => setVehicle({ ...vehicle, make: t })}
            />
            <TextInput
              style={[styles.smallInput, { flex: 2 }]}
              placeholder="Model"
              placeholderTextColor="#64748B"
              value={vehicle.model}
              onChangeText={(t) => setVehicle({ ...vehicle, model: t })}
            />
          </View>
          <TouchableOpacity
            style={styles.closeVehicleBtn}
            onPress={() => setShowVehicleModal(false)}
          >
            <Text style={styles.closeVehicleBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* TAB 1: AI MECHANIC */}
        {activeTab === 'mechanic' && (
          <View>
            <View style={styles.heroBanner}>
              <Text style={styles.heroTitle}>AI Mechanic Diagnostic</Text>
              <Text style={styles.heroDesc}>
                Describe symptoms, warning lights, or sounds for instant root-cause analysis and repair cost estimates.
              </Text>
            </View>

            {/* Quick Symptom Chips */}
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

            {/* Input Box */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="E.g., Squealing noise when pressing the brakes, or Check Engine light flashing..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                value={symptomText}
                onChangeText={setSymptomText}
              />

              {/* Photo Attachment Area */}
              {attachedPhoto ? (
                <View style={styles.attachedPhotoContainer}>
                  <Image source={{ uri: attachedPhoto.uri }} style={styles.attachedThumbnail} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.photoAttachedTitle}>
                      {attachedPhoto.isSample ? "Sample Photo Attached" : "Photo Attached"}
                    </Text>
                    <Text style={styles.photoAttachedSub}>Will be evaluated in visual AI inspection</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAttachedPhoto(null)} style={styles.removePhotoBtn}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoActionRow}>
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                    <Ionicons name="camera-outline" size={17} color="#60A5FA" style={{ marginRight: 6 }} />
                    <Text style={styles.addPhotoBtnText}>Attach Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.samplePhotoBtn} onPress={useSamplePhoto}>
                    <Ionicons name="image-outline" size={15} color="#94A3B8" style={{ marginRight: 4 }} />
                    <Text style={styles.samplePhotoBtnText}>Use Sample Photo</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.diagnoseBtn}
                onPress={() => runDiagnosis()}
                disabled={loadingDiagnosis}
              >
                {loadingDiagnosis ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="stethoscope" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.diagnoseBtnText}>Run AI Diagnosis</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Diagnosis Result Card */}
            {diagnosisResult && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.urgencyBadge(diagnosisResult.urgency)}>
                    <Text style={styles.urgencyBadgeText}>
                      Urgency: {diagnosisResult.urgency.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.safetyBadge(diagnosisResult.safe_to_drive)}>
                    <Ionicons
                      name={diagnosisResult.safe_to_drive ? "shield-checkmark" : "warning"}
                      size={14}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.safetyBadgeText}>
                      {diagnosisResult.safe_to_drive ? "Safe to Drive" : "Do Not Drive"}
                    </Text>
                  </View>
                </View>

                {/* Visual Inspection Box if photo was provided */}
                {diagnosisResult.image_analysis && (
                  <View style={styles.visualInspectionBox}>
                    <View style={styles.visualInspectionHeader}>
                      <Ionicons name="scan-outline" size={18} color="#60A5FA" style={{ marginRight: 6 }} />
                      <Text style={styles.visualInspectionTitle}>Visual Inspection Analysis</Text>
                    </View>
                    <Text style={styles.visualInspectionText}>{diagnosisResult.image_analysis}</Text>
                  </View>
                )}

                <Text style={styles.analysisNarrative}>{diagnosisResult.reply}</Text>

                {/* Probable Issues */}
                <Text style={styles.subSectionTitle}>Probable Causes</Text>
                {diagnosisResult.probable_issues.map((issue, idx) => (
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
                    <Text style={styles.statValue}>{diagnosisResult.estimated_cost_range}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Specialty Required</Text>
                    <Text style={styles.statValue}>{diagnosisResult.recommended_specialty}</Text>
                  </View>
                </View>

                {/* DIY Parts Sourcing Section */}
                {diagnosisResult.parts_sourcing && diagnosisResult.parts_sourcing.length > 0 && (
                  <View style={styles.partsSourcingContainer}>
                    <View style={styles.partsHeaderRow}>
                      <MaterialCommunityIcons name="toolbox-outline" size={22} color="#F59E0B" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.partsSectionTitle}>Source Your Own Parts</Text>
                        <Text style={styles.partsSectionSubtitle}>
                          Direct links to buy OEM & aftermarket parts for your {vehicle.year} {vehicle.make} {vehicle.model}:
                        </Text>
                      </View>
                    </View>

                    {diagnosisResult.parts_sourcing.map((part, idx) => (
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
                {diagnosisResult.questions_for_mechanic?.length > 0 && (
                  <View style={styles.questionsContainer}>
                    <Text style={styles.questionsTitle}>Questions to Ask Your Mechanic:</Text>
                    {diagnosisResult.questions_for_mechanic.map((q, i) => (
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
                  onPress={() => handleFindSpecialistsForDiagnosis(diagnosisResult.recommended_specialty)}
                >
                  <Ionicons name="location-sharp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.actionSpecialistsBtnText}>
                    Find {diagnosisResult.recommended_specialty} Shops Nearby
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
                  <TouchableOpacity
                    style={styles.submitConsultBtn}
                    onPress={handleBookConsultation}
                  >
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
  },
  vehicleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    marginHorizontal: 6,
  },
  vehicleEditCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  vehicleEditTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#93C5FD',
    marginBottom: 8,
  },
  vehicleInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallInput: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeVehicleBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeVehicleBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  heroBanner: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 14,
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
  inputContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textInput: {
    color: '#F8FAFC',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  diagnoseBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  diagnoseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    marginTop: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  analysisNarrative: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 14,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  issueItem: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  issueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  probBadge: (prob) => ({
    backgroundColor: prob === 'High' ? '#7F1D1D' : prob === 'Medium' ? '#78350F' : '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  }),
  probBadgeText: {
    color: '#F1F5F9',
    fontSize: 10,
    fontWeight: '600',
  },
  issueDetails: {
    fontSize: 12,
    color: '#94A3B8',
  },
  costSpecialtyRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60A5FA',
  },
  questionsContainer: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  questionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  questionBullet: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 16,
  },
  actionSpecialistsBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  actionSpecialistsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
  attachedPhotoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  attachedThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  photoAttachedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  photoAttachedSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  removePhotoBtn: {
    padding: 4,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  addPhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 9,
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
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  samplePhotoBtnText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  visualInspectionBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  visualInspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  visualInspectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60A5FA',
  },
  visualInspectionText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  partsSourcingContainer: {
    marginTop: 14,
    marginBottom: 10,
  },
  partsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  partsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partsSectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  partCard: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
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
    marginBottom: 4,
  },
  partRetailerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginRight: 8,
  },
  recommendedBadge: {
    backgroundColor: '#065F46',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  partBadgeTag: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 2,
  },
  partDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginVertical: 6,
    lineHeight: 16,
  },
  sourcePartsBtn: {
    backgroundColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  sourcePartsBtnFeatured: {
    backgroundColor: '#059669',
  },
  sourcePartsBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
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
