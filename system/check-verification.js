// check-verification.js
import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve("../.env") });

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.get("/:token", async (req, res) => {
  const { token } = req.params;

  const { data: akun } = await supabase
    .from("akun")
    .select("email_verified")
    .eq("token_verifikasi", token)
    .maybeSingle();

  res.json({ verified: akun?.email_verified || false });
});

export default router;
