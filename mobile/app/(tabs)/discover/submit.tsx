import { EventArg, NavigationAction } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { api, getApiError } from '@/lib/api';

const INDUSTRIES = ['SaaS', 'Fintech', 'Edtech', 'Healthtech', 'E-commerce', 'Logistics', 'AI/ML', 'Cleantech', 'Gaming', 'Other'];

export default function SubmitProductScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const submittedRef = useRef(false);

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [mediaUris, setMediaUris] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [descError, setDescError] = useState('');
  const [success, setSuccess] = useState(false);
  const mountedRef = useRef(true);
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatingRef = useRef(false);

  function goBackToProfile() {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.replace({ pathname: '/(tabs)/profile', params: { tab: 'products' } });
  }

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribeBeforeRemove = navigation.addListener(
      'beforeRemove',
      (e: EventArg<'beforeRemove', true, { action: NavigationAction }>) => {
        if (navigatingRef.current) return;
        e.preventDefault();
        goBackToProfile();
      },
    );

    let androidSubscription: ReturnType<typeof BackHandler.addEventListener> | null = null;
    if (Platform.OS === 'android') {
      androidSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBackToProfile();
        return true;
      });
    }

    return () => {
      mountedRef.current = false;
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
      unsubscribeBeforeRemove();
      androidSubscription?.remove();
    };
  }, [navigation]);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    return url.trim().startsWith('https://');
  };

  const validateDescription = (text: string): boolean => text.length <= 500;

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const pickMedia = async () => {
    if (mediaUris.length >= 5) {
      Alert.alert('Limit reached', 'You can upload up to 5 media images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - mediaUris.length,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setMediaUris((prev) => [...prev, ...newUris].slice(0, 5));
    }
  };

  const removeMedia = (uri: string) => {
    setMediaUris((prev) => prev.filter((u) => u !== uri));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('tagline', tagline.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (website.trim()) formData.append('website', website.trim());
      if (industry) formData.append('industry', industry);
      if (country.trim()) formData.append('countries[]', country.trim());

      if (logoUri) {
        const ext = logoUri.split('.').pop() ?? 'jpg';
        formData.append('logo', {
          uri: logoUri,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          name: `logo.${ext}`,
        } as unknown as Blob);
      }

      mediaUris.forEach((uri, i) => {
        const ext = uri.split('.').pop() ?? 'jpg';
        formData.append('media', {
          uri,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          name: `media_${i}.${ext}`,
        } as unknown as Blob);
      });

      return api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['home-products'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      backTimerRef.current = setTimeout(() => {
        if (mountedRef.current) goBackToProfile();
      }, 2000);
    },
    onError: (e) => {
      submittedRef.current = false;
      setError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const canSubmit = name.trim().length >= 3 && tagline.trim().length >= 10;

  const handleSubmit = () => {
    if (!canSubmit || submittedRef.current || mutation.isPending) return;

    setNameError('');
    if (name.trim().length < 3) {
      setNameError('Product name must be at least 3 characters.');
      return;
    }
    if (/^[^a-zA-Z0-9\s]+$/.test(name.trim())) {
      setNameError('Product name cannot consist of only symbols.');
      return;
    }
    if (/^[0-9\s]+$/.test(name.trim())) {
      setNameError('Product name cannot consist of only numbers.');
      return;
    }
    if (!validateUrl(website)) {
      setUrlError('Please enter a valid URL starting with https://');
      return;
    }
    if (!validateDescription(description)) {
      setDescError('Description exceeds the maximum allowed length (500 characters).');
      return;
    }

    setUrlError('');
    setDescError('');
    setError('');
    submittedRef.current = true;
    mutation.mutate();
  };

  if (success) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.topBar}>
          <Pressable onPress={goBackToProfile} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </Pressable>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={44} color={Colors.brand.orange} />
          </View>
          <Text style={styles.successTitle}>Product Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your product has been submitted and will appear in the directory after review.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.topBar}>
        <Pressable onPress={goBackToProfile} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Submit Product</Text>
        <Pressable
          style={[styles.submitBtn, !canSubmit && { opacity: 0.4 }]}
          onPress={handleSubmit}
          disabled={!canSubmit || mutation.isPending}
        >
          <Text style={styles.submitBtnText}>{mutation.isPending ? 'Submitting...' : 'Submit'}</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {!!error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={Colors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Logo</Text>
          <Pressable style={styles.logoPicker} onPress={pickLogo}>
            {logoUri ? (
              <View style={styles.logoPreviewWrap}>
                <Image source={{ uri: logoUri }} style={styles.logoPreview} contentFit="cover" />
                <Pressable
                  style={styles.logoRemove}
                  onPress={() => setLogoUri(null)}
                >
                  <Feather name="x" size={14} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Feather name="image" size={28} color={Colors.text.tertiary} />
                <Text style={styles.logoPlaceholderText}>Upload Logo</Text>
                <Text style={styles.logoPlaceholderHint}>Square image recommended</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Product Name * <Text style={styles.labelHint}>(min 3 chars)</Text></Text>
          <TextInput
            style={[styles.input, !!nameError && styles.inputError]}
            value={name}
            onChangeText={(v) => { setName(v); if (nameError) setNameError(''); }}
            onBlur={() => {
              const trimmed = name.trim();
              if (trimmed.length > 0 && trimmed.length < 3) {
                setNameError('Product name must be at least 3 characters.');
              } else if (trimmed.length >= 3 && /^[^a-zA-Z0-9\s]+$/.test(trimmed)) {
                setNameError('Product name cannot consist of only symbols.');
              } else if (trimmed.length >= 3 && /^[0-9\s]+$/.test(trimmed)) {
                setNameError('Product name cannot consist of only numbers.');
              }
            }}
            placeholder="e.g. Supercart"
            placeholderTextColor={Colors.text.tertiary}
            autoCorrect={false}
            maxLength={80}
          />
          {!!nameError && <Text style={styles.fieldError}>{nameError}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tagline * <Text style={styles.labelHint}>(10–120 chars)</Text></Text>
          <TextInput
            style={styles.input}
            value={tagline}
            onChangeText={setTagline}
            placeholder="One sentence that captures your product"
            placeholderTextColor={Colors.text.tertiary}
            maxLength={120}
          />
          <Text style={styles.charCount}>{tagline.length}/120</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description <Text style={styles.labelHint}>(max 500 chars)</Text></Text>
          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: 'top' }, !!descError && styles.inputError]}
            value={description}
            onChangeText={(v) => {
              setDescription(v);
              if (descError && v.length <= 500) setDescError('');
            }}
            placeholder="What problem does it solve? Who is it for?"
            placeholderTextColor={Colors.text.tertiary}
            multiline
            maxLength={500}
          />
          <Text style={[styles.charCount, description.length > 500 && { color: Colors.status.error }]}>
            {description.length}/500
          </Text>
          {!!descError && <Text style={styles.fieldError}>{descError}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={[styles.input, !!urlError && styles.inputError]}
            value={website}
            onChangeText={(v) => { setWebsite(v); if (urlError) setUrlError(''); }}
            placeholder="https://yourproduct.com"
            placeholderTextColor={Colors.text.tertiary}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!urlError && <Text style={styles.fieldError}>{urlError}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Country / Region</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. Saudi Arabia, UAE, Egypt"
            placeholderTextColor={Colors.text.tertiary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Industry</Text>
          <View style={styles.industryGrid}>
            {INDUSTRIES.map((ind) => (
              <Pressable
                key={ind}
                style={[styles.industryChip, industry === ind && styles.industryChipActive]}
                onPress={() => setIndustry(industry === ind ? '' : ind)}
              >
                <Text style={[styles.industryChipText, industry === ind && styles.industryChipTextActive]}>{ind}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.mediaHeader}>
            <Text style={styles.label}>Screenshots / Media</Text>
            <Text style={styles.labelHint}>({mediaUris.length}/5)</Text>
          </View>
          {mediaUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={styles.mediaRow}>
                {mediaUris.map((uri) => (
                  <View key={uri} style={styles.mediaThumbWrap}>
                    <Image source={{ uri }} style={styles.mediaThumb} contentFit="cover" />
                    <Pressable style={styles.mediaRemove} onPress={() => removeMedia(uri)}>
                      <Feather name="x" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <Pressable style={styles.mediaPickerBtn} onPress={pickMedia} disabled={mediaUris.length >= 5}>
            <Feather name="plus" size={18} color={Colors.brand.orange} />
            <Text style={styles.mediaPickerText}>Add Screenshots</Text>
          </Pressable>
        </View>

        <View style={styles.tipCard}>
          <Feather name="info" size={16} color={Colors.brand.orange} />
          <Text style={styles.tipText}>
            Products are reviewed before going live. Make sure your tagline clearly explains what you built.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.bg.primary, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  topBarTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  submitBtn: { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: Colors.brand.orange, borderRadius: 20 },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  labelHint: { fontSize: 12, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular', fontWeight: 'normal' },
  input: { borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_400Regular', backgroundColor: Colors.bg.primary },
  inputError: { borderColor: Colors.status.error },
  fieldError: { fontSize: 12, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  charCount: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'right', fontFamily: 'Inter_400Regular' },
  industryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  industryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: Colors.bg.primary },
  industryChipActive: { backgroundColor: Colors.brand.light, borderColor: Colors.brand.orange },
  industryChipText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  industryChipTextActive: { color: Colors.brand.orange },
  logoPicker: { alignItems: 'center' },
  logoPreviewWrap: { position: 'relative' },
  logoPreview: { width: 96, height: 96, borderRadius: 20, borderWidth: 2, borderColor: Colors.brand.orange },
  logoRemove: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.status.error, justifyContent: 'center', alignItems: 'center' },
  logoPlaceholder: { width: 120, height: 120, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border.default, backgroundColor: Colors.bg.primary, justifyContent: 'center', alignItems: 'center', gap: 6 },
  logoPlaceholderText: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, fontFamily: 'Inter_600SemiBold' },
  logoPlaceholderHint: { fontSize: 11, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
  mediaHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mediaRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  mediaThumbWrap: { position: 'relative' },
  mediaThumb: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.light },
  mediaRemove: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.status.error, justifyContent: 'center', alignItems: 'center' },
  mediaPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.brand.orange, borderRadius: 12, backgroundColor: Colors.brand.light, justifyContent: 'center' },
  mediaPickerText: { fontSize: 14, fontWeight: '600', color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold' },
  tipCard: { flexDirection: 'row', gap: 10, backgroundColor: Colors.brand.light, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.brand.orange + '40' },
  tipText: { flex: 1, fontSize: 13, color: Colors.text.secondary, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.brand.light, justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  successSubtitle: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22, fontFamily: 'Inter_400Regular' },
});
