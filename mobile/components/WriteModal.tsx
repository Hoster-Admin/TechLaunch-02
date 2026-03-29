import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { api, getApiError } from '@/lib/api';

type Mode = 'post' | 'article';

const DEFAULT_POST_CATEGORIES = ['Discussion', 'Milestone', 'Tip', 'Question', 'Announcement', 'Ask'];
const DEFAULT_ARTICLE_CATEGORIES = ['Guide', 'Founder Story', 'Report', 'Tip', 'For Students', 'Business'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WriteModal({ visible, onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [mode, setMode] = useState<Mode>('post');
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [postCategory, setPostCategory] = useState('');
  const [articleCategory, setArticleCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [error, setError] = useState('');

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags').then(r => r.data?.data ?? {}),
    staleTime: 5 * 60 * 1000,
  });
  const postCategories    = (tagsData?.post    ?? []).map((t: { name: string }) => t.name).filter(Boolean).length > 0
    ? (tagsData.post).map((t: { name: string }) => t.name)
    : DEFAULT_POST_CATEGORIES;
  const articleCategories = (tagsData?.article ?? []).map((t: { name: string }) => t.name).filter(Boolean).length > 0
    ? (tagsData.article).map((t: { name: string }) => t.name)
    : DEFAULT_ARTICLE_CATEGORIES;

  const bodyRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const reset = useCallback(() => {
    setMode('post');
    setBody('');
    setTitle('');
    setImageUri(null);
    setPostCategory('');
    setArticleCategory('');
    setShowCategoryPicker(false);
    setError('');
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const currentCategories = mode === 'post' ? postCategories : articleCategories;
  const currentCategory = (mode === 'post' ? postCategory : articleCategory) || currentCategories[0] || '';
  const setCurrentCategory = mode === 'post' ? setPostCategory : setArticleCategory;

  const mutation = useMutation({
    mutationFn: async () => {
      const category = currentCategory;

      if (imageUri) {
        const formData = new FormData();
        const ext = imageUri.split('.').pop() ?? 'jpg';
        formData.append('image', {
          uri: imageUri,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          name: `upload.${ext}`,
        } as unknown as Blob);

        if (mode === 'article') {
          formData.append('type', 'article');
          formData.append('title', title.trim());
          formData.append('body', body.trim());
          formData.append('category', category);
        } else {
          formData.append('type', 'post');
          formData.append('content', body.trim());
          formData.append('category', category);
        }
        return api.post('/launcher', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      if (mode === 'article') {
        return api.post('/launcher', {
          type: 'article',
          title: title.trim(),
          body: body.trim(),
          category,
        });
      }
      return api.post('/launcher', {
        type: 'post',
        content: body.trim(),
        category,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['launcher'] });
      queryClient.invalidateQueries({ queryKey: ['launcher-posts'] });
      reset();
      onClose();
      onSuccess?.();
    },
    onError: (e) => {
      setError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const canPost = mode === 'post'
    ? body.trim().length >= 5 && body.trim().length <= 200
    : body.trim().length >= 20 && title.trim().length >= 5;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Share to Launcher</Text>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.modeTabs}>
            <Pressable
              style={[styles.modeTab, mode === 'post' && styles.modeTabActive]}
              onPress={() => { setMode('post'); setShowCategoryPicker(false); }}
            >
              <Text style={[styles.modeTabText, mode === 'post' && styles.modeTabTextActive]}>
                ✏️  Post
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === 'article' && styles.modeTabActive]}
              onPress={() => { setMode('article'); setShowCategoryPicker(false); }}
            >
              <Text style={[styles.modeTabText, mode === 'article' && styles.modeTabTextActive]}>
                📄  Article
              </Text>
            </Pressable>
          </View>

          <View style={styles.formArea}>
            {!!error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={13} color={Colors.status.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {mode === 'article' && (
              <TextInput
                style={styles.titleInput}
                placeholder="Article title..."
                placeholderTextColor={Colors.text.tertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                returnKeyType="next"
                onSubmitEditing={() => bodyRef.current?.focus()}
              />
            )}

            <TextInput
              ref={bodyRef}
              style={[styles.bodyInput, mode === 'article' && styles.bodyInputArticle]}
              placeholder={
                mode === 'post'
                  ? "What's on your mind? Share a milestone, tip, question, or discussion..."
                  : "Write your article... Share your insights with the tech community."
              }
              placeholderTextColor={Colors.text.tertiary}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              maxLength={mode === 'post' ? 200 : 2000}
              autoFocus
            />

            {imageUri && (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
                <Pressable style={styles.imageRemove} onPress={() => setImageUri(null)}>
                  <Feather name="x" size={13} color="#fff" />
                </Pressable>
              </View>
            )}

            <Text style={styles.charCount}>{body.length}/{mode === 'post' ? 200 : 2000}</Text>
          </View>

          {showCategoryPicker && (
            <View style={styles.categoryMenu}>
              <ScrollView bounces={false}>
                {currentCategories.map(cat => (
                  <Pressable
                    key={cat}
                    style={styles.categoryOption}
                    onPress={() => { setCurrentCategory(cat); setShowCategoryPicker(false); }}
                  >
                    {currentCategory === cat && (
                      <Feather name="check" size={14} color={Colors.brand.orange} style={{ marginRight: 8 }} />
                    )}
                    <Text style={[
                      styles.categoryOptionText,
                      currentCategory === cat && styles.categoryOptionTextActive,
                      currentCategory !== cat && { marginLeft: 22 },
                    ]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.bottomRow}>
            <Pressable
              style={styles.categoryBtn}
              onPress={() => setShowCategoryPicker(v => !v)}
            >
              <Text style={styles.categoryBtnText}>{currentCategory}</Text>
              <Feather name="chevron-down" size={14} color={Colors.text.secondary} />
            </Pressable>

            <Pressable style={styles.photoBtn} onPress={pickImage}>
              <Text style={styles.photoBtnText}>📷  Photo</Text>
            </Pressable>

            <Pressable
              style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
              onPress={() => { if (canPost && !mutation.isPending) mutation.mutate(); }}
              disabled={!canPost || mutation.isPending}
            >
              <Text style={styles.postBtnText}>
                {mutation.isPending ? 'Posting...' : 'Post'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.bg.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.default,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  modeTabActive: {
    backgroundColor: Colors.brand.orange,
    borderColor: Colors.brand.orange,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    fontFamily: 'Inter_600SemiBold',
  },
  modeTabTextActive: { color: '#fff' },
  formArea: {
    borderWidth: 1.5,
    borderColor: Colors.brand.orange,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    minHeight: 140,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  errorText: { flex: 1, fontSize: 12, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'Inter_600SemiBold',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    marginBottom: 8,
  },
  bodyInput: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    minHeight: 90,
  },
  bodyInputArticle: { minHeight: 100 },
  imagePreviewWrap: { position: 'relative', alignSelf: 'flex-start', marginTop: 8 },
  imagePreview: { width: 120, height: 90, borderRadius: 8, borderWidth: 1, borderColor: Colors.border.default },
  imageRemove: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  categoryMenu: {
    position: 'absolute',
    bottom: 72,
    left: 16,
    backgroundColor: Colors.bg.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: 240,
    zIndex: 99,
    minWidth: 180,
    overflow: 'hidden',
  },
  categoryOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  categoryOptionText: { fontSize: 14, color: Colors.text.primary, fontFamily: 'Inter_400Regular' },
  categoryOptionTextActive: { color: Colors.brand.orange, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  categoryBtnText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  photoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  photoBtnText: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  postBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: Colors.brand.orange,
  },
  postBtnDisabled: { backgroundColor: Colors.border.default },
  postBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
});
