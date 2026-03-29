import axios from "axios";

const NOTIFY_BASE = process.env.EXPO_PUBLIC_NOTIFY_URL ?? "https://tlmena.com/api";

const notifyApi = axios.create({
  baseURL: NOTIFY_BASE,
  timeout: 8000,
});

export async function registerPushToken(username: string, token: string) {
  try {
    await notifyApi.post("/tokens/register", { username, token });
  } catch (err) {
    console.warn("[notify] registerPushToken failed:", err);
  }
}

export async function unregisterPushToken(username: string) {
  try {
    await notifyApi.delete("/tokens/register", { data: { username } });
  } catch (err) {
    console.warn("[notify] unregisterPushToken failed:", err);
  }
}

export async function notifyComment(params: {
  targetUsername: string;
  commenterName: string;
  postTitle?: string;
  postId: string;
  postType?: string;
}) {
  try {
    await notifyApi.post("/notify/comment", params);
  } catch (err) {
    console.warn("[notify] notifyComment failed:", err);
  }
}

export async function notifyReply(params: {
  targetUsername: string;
  commenterName: string;
  postId: string;
}) {
  try {
    await notifyApi.post("/notify/reply", params);
  } catch (err) {
    console.warn("[notify] notifyReply failed:", err);
  }
}

export async function notifyUpvote(params: {
  targetUsername: string;
  voterName: string;
  productName: string;
  productId: string;
}) {
  try {
    await notifyApi.post("/notify/upvote", params);
  } catch (err) {
    console.warn("[notify] notifyUpvote failed:", err);
  }
}

export async function notifyFollow(params: {
  targetUsername: string;
  followerName: string;
}) {
  try {
    await notifyApi.post("/notify/follow", params);
  } catch (err) {
    console.warn("[notify] notifyFollow failed:", err);
  }
}
