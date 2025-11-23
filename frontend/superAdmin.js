// frontend/superAdmin.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
dotenv.config({ path: path.resolve("../.env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export class SuperAdminController {
  // GET semua perusahaan pagination 10 perusahaan
  static async getAllPerusahaan(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("perusahaan")
        .select("*", { count: "exact" })
        .order("nama_perusahaan", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({ data, page, limit, total: count });
    } catch (err) {
      console.error("❌ getAllPerusahaan:", err);
      res.status(500).json({ message: "Gagal mengambil data perusahaan" });
    }
  }


  // GET semua admin /10 pagination 
  static async getAllAdmins(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("akun")
        .select("id_akun, username, email, id_perusahaan", { count: "exact" })
        .eq("id_jabatan", "ADMIN")
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({ data, page, limit, total: count });
    } catch (err) {
      console.error("❌ getAllAdmins:", err);
      res.status(500).json({ message: "Gagal mengambil data admin" });
    }
  }


  // SUSPEND perusahaan
  static async suspendPerusahaan(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const { error } = await supabase
        .from("perusahaan")
        .update({ status_aktif: status })
        .eq("id_perusahaan", id);

      if (error) throw error;
      res.json({ message: "Status perusahaan diperbarui" });
    } catch (err) {
      console.error("❌ suspendPerusahaan:", err);
      res.status(500).json({ message: "Gagal memperbarui status perusahaan" });
    }
  }

  // CREATE perusahaan
  static async createPerusahaan(req, res) {
    try {
      const { nama_perusahaan, alamat } = req.body;
      const id_perusahaan = crypto.randomUUID().slice(0, 8).toUpperCase();

      const { error } = await supabase.from("perusahaan").insert({
        id_perusahaan,
        nama_perusahaan,
        alamat,
        status_aktif: true,
      });

      if (error) throw error;
      res.json({ message: "Perusahaan ditambahkan" });
    } catch (err) {
      console.error("❌ createPerusahaan:", err);
      res.status(500).json({ message: "Gagal menambah perusahaan" });
    }
  }

  // UPDATE perusahaan
  static async updatePerusahaan(req, res) {
    try {
      const { id } = req.params;
      const { nama_perusahaan, alamat } = req.body;

      const { error } = await supabase
        .from("perusahaan")
        .update({ nama_perusahaan, alamat })
        .eq("id_perusahaan", id);

      if (error) throw error;
      res.json({ message: "Perusahaan diperbarui" });
    } catch (err) {
      console.error("❌ updatePerusahaan:", err);
      res.status(500).json({ message: "Gagal update perusahaan" });
    }
  }

  // DELETE perusahaan
  static async deletePerusahaan(req, res) {
    try {
      const { id } = req.params;
      const { error } = await supabase
        .from("perusahaan")
        .delete()
        .eq("id_perusahaan", id);

      if (error) throw error;
      res.json({ message: "Perusahaan dihapus" });
    } catch (err) {
      console.error("❌ deletePerusahaan:", err);
      res.status(500).json({ message: "Gagal hapus perusahaan" });
    }
  }
}
