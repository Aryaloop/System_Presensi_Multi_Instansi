-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id_log uuid NOT NULL DEFAULT gen_random_uuid(),
  id_akun uuid,
  id_perusahaan character varying,
  action character varying NOT NULL,
  target_table character varying,
  target_id character varying,
  details jsonb,
  ip_address character varying,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id_log),
  CONSTRAINT activity_logs_id_akun_fkey FOREIGN KEY (id_akun) REFERENCES public.akun(id_akun),
  CONSTRAINT activity_logs_id_perusahaan_fkey FOREIGN KEY (id_perusahaan) REFERENCES public.perusahaan(id_perusahaan)
);
CREATE TABLE public.akun (
  id_akun uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL,
  email character varying NOT NULL,
  password character varying,
  no_tlp character varying,
  alamat_karyawan character varying,
  id_jabatan character varying NOT NULL,
  id_perusahaan character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  email_verified boolean DEFAULT false,
  token_verifikasi text,
  token_reset text,
  id_shift character varying,
  status_akun character varying DEFAULT 'AKTIF'::character varying,
  CONSTRAINT akun_pkey PRIMARY KEY (id_akun),
  CONSTRAINT akun_id_jabatan_fkey FOREIGN KEY (id_jabatan) REFERENCES public.jabatan(id_jabatan),
  CONSTRAINT akun_id_perusahaan_fkey FOREIGN KEY (id_perusahaan) REFERENCES public.perusahaan(id_perusahaan),
  CONSTRAINT akun_id_shift_fkey FOREIGN KEY (id_shift) REFERENCES public.shift(id_shift)
);
CREATE TABLE public.izin_wfh (
  id_izin uuid NOT NULL DEFAULT gen_random_uuid(),
  id_akun uuid NOT NULL,
  tanggal_mulai date NOT NULL,
  tanggal_selesai date NOT NULL,
  jenis_izin USER-DEFINED NOT NULL,
  alasan text,
  status_persetujuan USER-DEFINED DEFAULT 'PENDING'::status_persetujuan,
  tanggal_pengajuan timestamp with time zone DEFAULT now(),
  tanggal_verifikasi timestamp with time zone,
  id_verifikator uuid,
  keterangan text,
  CONSTRAINT izin_wfh_pkey PRIMARY KEY (id_izin),
  CONSTRAINT izin_wfh_id_verifikator_fkey FOREIGN KEY (id_verifikator) REFERENCES public.akun(id_akun),
  CONSTRAINT izin_wfh_id_akun_fkey FOREIGN KEY (id_akun) REFERENCES public.akun(id_akun)
);
CREATE TABLE public.jabatan (
  id_jabatan character varying NOT NULL,
  nama_jabatan character varying NOT NULL,
  CONSTRAINT jabatan_pkey PRIMARY KEY (id_jabatan)
);
CREATE TABLE public.kehadiran (
  id_kehadiran uuid NOT NULL DEFAULT gen_random_uuid(),
  id_akun uuid NOT NULL,
  id_shift character varying,
  jam_masuk timestamp with time zone,
  jam_pulang timestamp with time zone,
  status character varying CHECK (status::text = ANY (ARRAY['HADIR'::character varying::text, 'IZIN'::character varying::text, 'ALFA'::character varying::text, 'WFH'::character varying::text, 'TERLAMBAT'::character varying::text])),
  latitude_absen double precision,
  longitude_absen double precision,
  gambar_absen text,
  created_at timestamp with time zone DEFAULT now(),
  id_perusahaan character varying,
  CONSTRAINT kehadiran_pkey PRIMARY KEY (id_kehadiran),
  CONSTRAINT kehadiran_id_shift_fkey FOREIGN KEY (id_shift) REFERENCES public.shift(id_shift),
  CONSTRAINT kehadiran_id_perusahaan_fkey FOREIGN KEY (id_perusahaan) REFERENCES public.perusahaan(id_perusahaan),
  CONSTRAINT kehadiran_id_akun_fkey FOREIGN KEY (id_akun) REFERENCES public.akun(id_akun)
);
CREATE TABLE public.master_paket (
  id_paket uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_paket character varying NOT NULL,
  durasi_hari integer NOT NULL,
  harga numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_paket_pkey PRIMARY KEY (id_paket)
);
CREATE TABLE public.master_scoring_rules (
  id_rule uuid NOT NULL DEFAULT gen_random_uuid(),
  id_perusahaan character varying NOT NULL,
  kode_rule character varying NOT NULL,
  nama_rule character varying,
  poin numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  CONSTRAINT master_scoring_rules_pkey PRIMARY KEY (id_rule),
  CONSTRAINT master_rules_perusahaan_fkey FOREIGN KEY (id_perusahaan) REFERENCES public.perusahaan(id_perusahaan)
);
CREATE TABLE public.perusahaan (
  id_perusahaan character varying NOT NULL,
  nama_perusahaan character varying NOT NULL,
  alamat text,
  latitude double precision,
  longitude double precision,
  radius_m integer DEFAULT 150,
  logo_perusahaan text,
  status_aktif boolean DEFAULT true,
  tanggal_berakhir_langganan timestamp with time zone,
  paket_langganan character varying,
  CONSTRAINT perusahaan_pkey PRIMARY KEY (id_perusahaan)
);
CREATE TABLE public.score (
  id_score uuid NOT NULL DEFAULT gen_random_uuid(),
  id_kehadiran uuid NOT NULL,
  id_akun uuid NOT NULL,
  id_rule uuid,
  nilai_score numeric NOT NULL,
  keterangan text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT score_pkey PRIMARY KEY (id_score),
  CONSTRAINT score_id_kehadiran_fkey FOREIGN KEY (id_kehadiran) REFERENCES public.kehadiran(id_kehadiran),
  CONSTRAINT score_id_akun_fkey FOREIGN KEY (id_akun) REFERENCES public.akun(id_akun),
  CONSTRAINT score_id_rule_fkey FOREIGN KEY (id_rule) REFERENCES public.master_scoring_rules(id_rule)
);
CREATE TABLE public.shift (
  id_shift character varying NOT NULL,
  nama_shift character varying,
  jam_masuk time without time zone,
  jam_pulang time without time zone,
  id_perusahaan character varying,
  is_senin boolean DEFAULT false,
  is_selasa boolean DEFAULT false,
  is_rabu boolean DEFAULT false,
  is_kamis boolean DEFAULT false,
  is_jumat boolean DEFAULT false,
  is_sabtu boolean DEFAULT false,
  is_minggu boolean DEFAULT false,
  CONSTRAINT shift_pkey PRIMARY KEY (id_shift),
  CONSTRAINT shift_id_perusahaan_fkey FOREIGN KEY (id_perusahaan) REFERENCES public.perusahaan(id_perusahaan)
);