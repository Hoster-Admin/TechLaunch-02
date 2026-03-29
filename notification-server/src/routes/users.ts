import { Router, type IRouter } from "express";
import axios from "axios";

const router: IRouter = Router();

const UPSTREAM = "https://tlmena.com/api";

async function proxyGet(path: string, authHeader?: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (authHeader) headers["Authorization"] = authHeader;
  const res = await axios.get(`${UPSTREAM}${path}`, { headers });
  return res.data;
}

router.get("/users/:id/followers", async (req, res) => {
  try {
    const { id } = req.params;
    const auth = req.headers.authorization;
    const data = await proxyGet(`/users/${id}/followers`, auth);
    res.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  }
});

router.get("/users/:id/following", async (req, res) => {
  try {
    const { id } = req.params;
    const auth = req.headers.authorization;
    const data = await proxyGet(`/users/${id}/following`, auth);
    res.json(data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ message: "Failed to fetch following" });
    }
  }
});

export default router;
