import { db, pushTokensTable } from "@workspace/db";
import axios from "axios";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function getTokenFromDb(username: string): Promise<string | null> {
  try {
    const rows = await db
      .select()
      .from(pushTokensTable)
      .where(eq(pushTokensTable.username, username))
      .limit(1);
    return rows[0]?.token ?? null;
  } catch {
    return null;
  }
}

async function sendPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  await axios.post(
    EXPO_PUSH_URL,
    { to: token, title, body, data: data ?? {}, sound: "default" },
    { headers: { Accept: "application/json", "Content-Type": "application/json" } },
  );
}

router.post("/tokens/register", async (req, res) => {
  try {
    const { username, token } = req.body as { username: string; token: string };
    if (!username || !token) {
      res.status(400).json({ message: "Missing username or token" });
      return;
    }
    await db
      .insert(pushTokensTable)
      .values({ username, token, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: pushTokensTable.username,
        set: { token, updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    console.warn("[tokens/register] error:", err);
    res.status(500).json({ message: "Failed to register token" });
  }
});

router.delete("/tokens/register", async (req, res) => {
  try {
    const { username } = req.body as { username: string };
    if (!username) { res.status(400).json({ message: "Missing username" }); return; }
    await db.delete(pushTokensTable).where(eq(pushTokensTable.username, username));
    res.json({ ok: true });
  } catch (err) {
    console.warn("[tokens/unregister] error:", err);
    res.status(500).json({ message: "Failed to remove token" });
  }
});

router.post("/notify/comment", async (req, res) => {
  try {
    const { targetUsername, commenterName, postTitle, postId, postType } = req.body as {
      targetUsername: string;
      commenterName: string;
      postTitle?: string;
      postId: string;
      postType?: string;
    };
    if (!targetUsername || !commenterName || !postId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    if (targetUsername === commenterName) { res.json({ sent: false, reason: "Self notification skipped" }); return; }
    const token = await getTokenFromDb(targetUsername);
    if (!token) { res.json({ sent: false, reason: "No push token" }); return; }
    const title = `${commenterName} commented on your ${postType === "article" ? "article" : "post"}`;
    const body = postTitle ? `"${postTitle}"` : "Tap to see the comment";
    await sendPush(token, title, body, { screen: "launcher", postId });
    res.json({ sent: true });
  } catch (err) {
    console.warn("[notify/comment] error:", err);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

router.post("/notify/reply", async (req, res) => {
  try {
    const { targetUsername, commenterName, postId } = req.body as {
      targetUsername: string;
      commenterName: string;
      postId: string;
    };
    if (!targetUsername || !commenterName || !postId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    if (targetUsername === commenterName) { res.json({ sent: false, reason: "Self notification skipped" }); return; }
    const token = await getTokenFromDb(targetUsername);
    if (!token) { res.json({ sent: false, reason: "No push token" }); return; }
    await sendPush(token, `${commenterName} replied to your comment`, "Tap to see the reply", { screen: "launcher", postId });
    res.json({ sent: true });
  } catch (err) {
    console.warn("[notify/reply] error:", err);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

router.post("/notify/upvote", async (req, res) => {
  try {
    const { targetUsername, voterName, productName, productId } = req.body as {
      targetUsername: string;
      voterName: string;
      productName: string;
      productId: string;
    };
    if (!targetUsername || !voterName || !productId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    if (targetUsername === voterName) { res.json({ sent: false, reason: "Self notification skipped" }); return; }
    const token = await getTokenFromDb(targetUsername);
    if (!token) { res.json({ sent: false, reason: "No push token" }); return; }
    await sendPush(token, `${voterName} upvoted ${productName}`, "Your product is gaining momentum! 🚀", { screen: "product", productId });
    res.json({ sent: true });
  } catch (err) {
    console.warn("[notify/upvote] error:", err);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

router.post("/notify/follow", async (req, res) => {
  try {
    const { targetUsername, followerName } = req.body as {
      targetUsername: string;
      followerName: string;
    };
    if (!targetUsername || !followerName) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    if (targetUsername === followerName) { res.json({ sent: false, reason: "Self notification skipped" }); return; }
    const token = await getTokenFromDb(targetUsername);
    if (!token) { res.json({ sent: false, reason: "No push token" }); return; }
    await sendPush(token, `${followerName} started following you`, "Tap to view their profile", { screen: "profile", username: followerName });
    res.json({ sent: true });
  } catch (err) {
    console.warn("[notify/follow] error:", err);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

export default router;
