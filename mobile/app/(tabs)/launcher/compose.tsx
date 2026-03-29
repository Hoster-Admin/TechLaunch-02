import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '@/components/Toast';
import { Colors } from '@/constants/Colors';
import { api, getApiError } from '@/lib/api';

export default function ComposeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ editId?: string; editTitle?: string; editBody?: string }>();
  const isEditing = !!params.editId;

  const [title, setTitle] = useState(params.editTitle ?? '');
  const [body, setBody] = useState(params.editBody ?? '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const bodyRef = useRef<TextInput>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(false);
    setTimeout(() => {
      setToastVisible(true);
      setTimeout(() => router.back(), 2100);
    }, 50);
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

  const mutation = useMutation({
    mutationFn: () => {
      const hasTitle = title.trim().length > 0;

      if (imageUri) {
        const formData = new FormData();
        if (hasTitle) {
          formData.append('title', title.trim());
          formData.append('type', 'article');
          formData.append('body', body.trim());
        } else {
          formData.append('content', body.trim());
          formData.append('type', 'post');
        }
        const ext = imageUri.split('.').pop() ?? 'jpg';
        formData.append('image', {
          uri: imageUri,
          type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
          name: `post_image.${ext}`,
        } as unknown as Blob);

        if (isEditing) {
          return api.put(`/launcher/${params.editId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        return api.post('/launcher', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const payload = hasTitle
        ? { title: title.trim(), body: body.trim(), type: 'article' }
        : { content: body.trim(), type: 'post' };

      if (isEditing) {
        return api.put(`/launcher/${params.editId}`, payload);
      }
      return api.post('/launcher', payload);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['launcher'] });
      queryClient.invalidateQueries({ queryKey: ['launcher-posts'] });
      if (isEditing && params.editId) {
        queryClient.invalidateQueries({ queryKey: ['launcherPost', params.editId] });
      }
      showToast(isEditing ? 'Post updated' : 'Post published');
    },
    onError: (e) => {
      setError(getApiError(e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const applyFormat = (prefix: string, suffix?: string) => {
    const end = suffix ?? prefix;
    const selected = body.slice(selection.start, selection.end);
    const word = selected || 'text';
    const newBody =
      body.slice(0, selection.start) + prefix + word + end + body.slice(selection.end);
    setBody(newBody);
    bodyRef.current?.focus();
  };

  const insertLinePrefix = (prefix: string) => {
    const before = body.slice(0, selection.start);
    const lineStart = before.lastIndexOf('\n') + 1;
    const newBody =
      body.slice(0, lineStart) + prefix + body.slice(lineStart);
    setBody(newBody);
    bodyRef.current?.focus();
  };

  const canPost = body.trim().length >= 5;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Toast message={toastMessage} visible={toastVisible} type="success" />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>{isEditing ? 'Edit Post' : 'New Post'}</Text>
        <Pressable
          style={[styles.postBtn, !canPost && { opacity: 0.4 }]}
          onPress={() => { if (canPost) mutation.mutate(); }}
          disabled={!canPost || mutation.isPending}
        >
          <Text style={styles.postBtnText}>
            {mutation.isPending ? (isEditing ? 'Saving...' : 'Posting...') : (isEditing ? 'Update' : 'Post')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        {!!error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={Colors.status.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <TextInput
          style={styles.titleInput}
          placeholder="Title (optional — adds article format)"
          placeholderTextColor={Colors.text.tertiary}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <View style={styles.divider} />
        <TextInput
          ref={bodyRef}
          style={styles.bodyInput}
          placeholder="What's on your mind? Share insights, ask questions, or start a discussion..."
          placeholderTextColor={Colors.text.tertiary}
          value={body}
          onChangeText={setBody}
          multiline
          autoFocus={!isEditing}
          textAlignVertical="top"
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        />

        {imageUri && (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
            <Pressable style={styles.imageRemove} onPress={() => setImageUri(null)}>
              <Feather name="x" size={14} color="#fff" />
            </Pressable>
          </View>
        )}

        <Text style={styles.charCount}>{body.length} chars</Text>
      </View>

      <View style={[styles.toolbar, { paddingBottom: Platform.OS === 'web' ? 16 : insets.bottom + 8 }]}>
        <Pressable style={styles.toolBtn} onPress={() => applyFormat('**', '**')} hitSlop={6}>
          <Text style={styles.toolBtnBold}>B</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => applyFormat('_', '_')} hitSlop={6}>
          <Text style={styles.toolBtnItalic}>I</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => insertLinePrefix('- ')} hitSlop={6}>
          <Feather name="list" size={16} color={Colors.text.secondary} />
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={() => insertLinePrefix('# ')} hitSlop={6}>
          <Feather name="hash" size={16} color={Colors.text.secondary} />
        </Pressable>
        <Pressable
          style={[styles.toolBtn, !!imageUri && styles.toolBtnActive]}
          onPress={imageUri ? () => setImageUri(null) : pickImage}
          hitSlop={6}
        >
          <Feather name="image" size={16} color={imageUri ? Colors.brand.orange : Colors.text.secondary} />
        </Pressable>
        <View style={styles.toolDivider} />
        <Text style={styles.toolHint}>Markdown supported</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  cancelBtn: { paddingVertical: 4 },
  cancelText: { fontSize: 15, color: Colors.text.secondary, fontFamily: 'Inter_500Medium' },
  topBarTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold' },
  postBtn: { paddingHorizontal: 16, paddingVertical: 7, backgroundColor: Colors.brand.orange, borderRadius: 20 },
  postBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  form: { flex: 1, padding: 16, gap: 0 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { flex: 1, fontSize: 13, color: Colors.status.error, fontFamily: 'Inter_400Regular' },
  titleInput: { fontSize: 18, fontWeight: '600', color: Colors.text.primary, fontFamily: 'Inter_600SemiBold', paddingVertical: 12 },
  divider: { height: 1, backgroundColor: Colors.border.light, marginVertical: 4 },
  bodyInput: { flex: 1, fontSize: 16, color: Colors.text.secondary, fontFamily: 'Inter_400Regular', lineHeight: 24, paddingVertical: 12 },
  imagePreviewWrap: { position: 'relative', alignSelf: 'flex-start', marginTop: 10 },
  imagePreview: { width: 160, height: 120, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.default },
  imageRemove: { position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  charCount: { fontSize: 12, color: Colors.text.tertiary, textAlign: 'right', fontFamily: 'Inter_400Regular', paddingTop: 4 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border.default, backgroundColor: Colors.bg.secondary },
  toolBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.border.default },
  toolBtnActive: { borderColor: Colors.brand.orange, backgroundColor: Colors.brand.light },
  toolBtnBold: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, fontFamily: 'Inter_700Bold' },
  toolBtnItalic: { fontSize: 15, fontStyle: 'italic', color: Colors.text.primary, fontFamily: 'Inter_400Regular' },
  toolDivider: { width: 1, height: 20, backgroundColor: Colors.border.default, marginHorizontal: 4 },
  toolHint: { fontSize: 11, color: Colors.text.tertiary, fontFamily: 'Inter_400Regular' },
});
