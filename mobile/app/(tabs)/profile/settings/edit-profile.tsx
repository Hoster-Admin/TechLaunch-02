import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { useAuth } from '@/contexts/AuthContext';
import { api, getApiError } from '@/lib/api';
import { adaptUser } from '@/lib/adapters';

const AVATAR_COLORS = ['#E15033', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

const ROLES = [
  { value: 'founder',      label: 'Founder',      emoji: '🚀' },
  { value: 'investor',     label: 'Investor',     emoji: '💰' },
  { value: 'builder',      label: 'Builder',      emoji: '⚡' },
  { value: 'pm',           label: 'PM',           emoji: '🧠' },
  { value: 'accelerator',  label: 'Accelerator',  emoji: '🏢' },
  { value: 'enthusiast',   label: 'Enthusiast',   emoji: '⭐' },
];

function hasEmoji(str: string): boolean {
  return /\p{Extended_Pictographic}/u.test(str);
}
function hasExcessiveRepeats(str: string): boolean {
  return /(.)\1{3,}/u.test(str);
}
function hasLetter(str: string): boolean {
  return /\p{L}/u.test(str);
}

function validateName(v: string): string {
  if (!v.trim()) return 'Full name is required';
  if (v.trim().length < 2) return 'Name must be at least 2 characters';
  if (v.trim().length > 60) return 'Name must be 60 characters or fewer';
  if (!hasLetter(v)) return 'Name must contain at least one real letter';
  if (hasEmoji(v)) return 'Emojis are not allowed in name';
  if (hasExcessiveRepeats(v)) return 'Name contains too many repeated characters';
  return '';
}

function validateHandle(v: string): string {
  if (!v.trim()) return 'Handle is required';
  if (v.trim().length < 3) return 'Handle must be at least 3 characters';
  if (v.trim().length > 30) return 'Handle must be 30 characters or fewer';
  if (/\s/.test(v)) return 'Handle cannot contain spaces';
  if (!/^[a-z0-9_]+$/i.test(v)) return 'Handle can only contain letters, numbers, and underscores';
  if (/^[0-9]+$/.test(v)) return 'Handle cannot be numbers only';
  return '';
}

function normalizeWebsite(v: string): string {
  const t = v.trim();
  if (!t) return t;
  if (t.startsWith('https://')) return t;
  if (t.startsWith('http://')) return `https://${t.slice(7)}`;
  return `https://${t}`;
}

function validateWebsite(v: string): string {
  if (!v.trim()) return '';
  const normalized = normalizeWebsite(v);
  try {
    new URL(normalized);
    return '';
  } catch {
    return 'Please enter a valid website URL';
  }
}

function validateLinkedin(v: string): string {
  if (!v.trim()) return '';
  if (!v.trim().startsWith('https://www.linkedin.com/') && !v.trim().startsWith('https://linkedin.com/'))
    return 'Please enter a valid LinkedIn URL only';
  return '';
}

function extractXUsername(v: string): string {
  const trimmed = v.trim().replace(/^@/, '');
  if (trimmed.startsWith('https://twitter.com/')) return trimmed.replace('https://twitter.com/', '').split('/')[0];
  if (trimmed.startsWith('https://x.com/')) return trimmed.replace('https://x.com/', '').split('/')[0];
  return trimmed;
}

function validateX(v: string): string {
  if (!v.trim()) return '';
  const username = extractXUsername(v);
  if (!username || /\s/.test(username)) return 'Please enter a valid X username';
  return '';
}

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const mountedRef = useRef(true);
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
    };
  }, []);

  const [name, setName] = useState(user?.name ?? '');
  const [handle, setHandle] = useState(user?.username ?? '');
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [role, setRole] = useState(user?.role ?? '');
  const [country, setCountry] = useState(user?.country ?? '');
  const [website, setWebsite] = useState(user?.website ?? '');
  const [twitter, setTwitter] = useState(extractXUsername(user?.twitter ?? ''));
  const [linkedin, setLinkedin] = useState(user?.linkedin ?? '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);

  const [nameError, setNameError] = useState('');
  const [handleError, setHandleError] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [linkedinError, setLinkedinError] = useState('');
  const [twitterError, setTwitterError] = useState('');
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateAll = (): boolean => {
    const ne = validateName(name);
    const he = validateHandle(handle);
    const we = validateWebsite(website);
    const le = validateLinkedin(linkedin);
    const te = validateX(twitter);
    setNameError(ne);
    setHandleError(he);
    setWebsiteError(we);
    setLinkedinError(le);
    setTwitterError(te);
    return !ne && !he && !we && !le && !te;
  };

  const isValid = !validateName(name) && !validateHandle(handle)
    && !validateWebsite(website) && !validateLinkedin(linkedin) && !validateX(twitter);

  const mutation = useMutation({
    mutationFn: () =>
      api.put<{ success: boolean; data: Record<string, unknown> }>('/users/me', {
        name: name.trim(),
        username: handle.trim(),
        headline: headline.trim() || undefined,
        bio,
        role,
        country,
        website: website.trim() ? normalizeWebsite(website) : undefined,
        twitter: twitter.trim() ? `https://x.com/${twitter.trim()}` : undefined,
        linkedin: linkedin.trim() || undefined,
        avatar_color: avatarColor,
      }),
    onSuccess: (res) => {
      const raw = res.data?.data ?? res.data ?? {};
      const adapted = adaptUser(typeof raw === 'object' && raw !== null ? raw : {});
      if (adapted.id && adapted.username) {
        updateUser(adapted);
        queryClient.invalidateQueries({ queryKey: ['myProfile'] });
        queryClient.invalidateQueries({ queryKey: ['userProfile', adapted.username] });
        if (user?.username && user.username !== adapted.username) {
          queryClient.invalidateQueries({ queryKey: ['userProfile', user.username] });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      }
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      backTimerRef.current = setTimeout(() => {
        if (mountedRef.current) router.back();
      }, 500);
    },
    onError: (e) => {
      setApiError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleSave = () => {
    if (!validateAll()) return;
    setApiError('');
    mutation.mutate();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {!!apiError && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={Colors.status.error} />
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
      )}

      {success && (
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={14} color={Colors.status.success} />
          <Text style={styles.successText}>Profile updated!</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, !!nameError && styles.inputError]}
          value={name}
          onChangeText={(v) => { setName(v); if (nameError) setNameError(validateName(v)); }}
          onBlur={() => setNameError(validateName(name))}
          placeholder="Your full name"
          placeholderTextColor={Colors.text.tertiary}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={61}
        />
        {!!nameError && <Text style={styles.fieldError}>{nameError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Handle *</Text>
        <View style={[styles.inputRow, !!handleError && styles.inputError]}>
          <Text style={styles.atSign}>@</Text>
          <TextInput
            style={[styles.input, styles.inputInRow]}
            value={handle}
            onChangeText={(v) => {
              const clean = v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
              setHandle(clean);
              if (handleError) setHandleError(validateHandle(clean));
            }}
            onBlur={() => setHandleError(validateHandle(handle))}
            placeholder="yourhandle"
            placeholderTextColor={Colors.text.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />
        </View>
        {!!handleError && <Text style={styles.fieldError}>{handleError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Headline</Text>
        <TextInput
          style={styles.input}
          value={headline}
          onChangeText={setHeadline}
          placeholder="e.g. Co-founder at TechCo | Builder"
          placeholderTextColor={Colors.text.tertiary}
          autoCapitalize="sentences"
          autoCorrect={false}
          maxLength={80}
        />
        <Text style={styles.charCount}>{headline.length}/80</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Role / Title</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => (
            <Pressable
              key={r.value}
              style={[styles.rolePill, role === r.value && styles.rolePillActive]}
              onPress={() => setRole(role === r.value ? '' : r.value)}
            >
              <Text style={styles.rolePillEmoji}>{r.emoji}</Text>
              <Text style={[styles.rolePillText, role === r.value && styles.rolePillTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Country</Text>
        <TextInput
          style={styles.input}
          value={country}
          onChangeText={setCountry}
          placeholder="e.g. Saudi Arabia"
          placeholderTextColor={Colors.text.tertiary}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={[styles.input, !!websiteError && styles.inputError]}
          value={website}
          onChangeText={(v) => { setWebsite(v); if (websiteError) setWebsiteError(validateWebsite(v)); }}
          onBlur={() => {
            if (website.trim() && !website.trim().startsWith('https://')) {
              setWebsite(normalizeWebsite(website));
            }
            setWebsiteError(validateWebsite(website));
          }}
          placeholder="yoursite.com"
          placeholderTextColor={Colors.text.tertiary}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!websiteError && <Text style={styles.fieldError}>{websiteError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>X (Twitter)</Text>
        <TextInput
          style={[styles.input, !!twitterError && styles.inputError]}
          value={twitter}
          onChangeText={(v) => { setTwitter(v.replace(/^@/, '')); if (twitterError) setTwitterError(validateX(v)); }}
          onBlur={() => setTwitterError(validateX(twitter))}
          placeholder="yourusername"
          placeholderTextColor={Colors.text.tertiary}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!twitterError && <Text style={styles.fieldError}>{twitterError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>LinkedIn</Text>
        <TextInput
          style={[styles.input, !!linkedinError && styles.inputError]}
          value={linkedin}
          onChangeText={(v) => { setLinkedin(v); if (linkedinError) setLinkedinError(validateLinkedin(v)); }}
          onBlur={() => setLinkedinError(validateLinkedin(linkedin))}
          placeholder="https://www.linkedin.com/in/yourhandle"
          placeholderTextColor={Colors.text.tertiary}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!linkedinError && <Text style={styles.fieldError}>{linkedinError}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell the community about yourself..."
          placeholderTextColor={Colors.text.tertiary}
          multiline
          maxLength={300}
        />
        <Text style={styles.charCount}>{bio.length}/300</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Background Color</Text>
        <View style={styles.colorRow}>
          {AVATAR_COLORS.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorSwatch, { backgroundColor: c }, avatarColor === c && styles.colorSwatchSelected]}
              onPress={() => setAvatarColor(c)}
            >
              {avatarColor === c && <Feather name="check" size={14} color="#fff" />}
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.saveBtn, (!isValid || mutation.isPending) && styles.saveBtnDisabled, { opacity: pressed ? 0.85 : 1 }]}
        onPress={handleSave}
        disabled={mutation.isPending}
      >
        <Text style={styles.saveBtnText}>{mutation.isPending ? 'Saving...' : 'Save Changes'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.secondary },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12 },
  successText: { flex: 1, fontSize: 13, color: Colors.status.success, fontFamily: 'Inter_500Medium' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, fontFamily: 'Inter_500Medium' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 12, backgroundColor: Colors.bg.primary },
  atSign: { paddingLeft: 14, fontSize: 15, color: Colors.text.tertiary, fontFamily: 'Inter_500Medium' },
  input: { borderWidth: 1.5, borderColor: Colors.border.default, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text.primary, fontFamily: 'Inter_400Regular', backgroundColor: Colors.bg.primary },
  inputInRow: { flex: 1, borderWidth: 0, borderRadius: 0, paddingLeft: 6 },
  inputError: { borderColor: Colors.status.error },
  fieldError: { fontSize: 12, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  charCount: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'right', fontFamily: 'Inter_400Regular' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border.default, backgroundColor: Colors.bg.primary },
  rolePillActive: { borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  rolePillEmoji: { fontSize: 14 },
  rolePillText: { fontSize: 13, fontWeight: '500', color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  rolePillTextActive: { color: Colors.brand.orange, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  colorSwatchSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  saveBtn: { backgroundColor: Colors.brand.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
});
