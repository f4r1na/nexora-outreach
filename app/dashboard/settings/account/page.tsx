"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";
import SectionHeader from "../_components/SectionHeader";
import SaveStatus from "../_components/SaveStatus";
import FormInput from "../_components/FormInput";
import FormTextarea from "../_components/FormTextarea";
import FormSelect from "../_components/FormSelect";

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.06, duration: 0.28, ease: EASE },
  };
}

const SIZE_OPTIONS = [
  { value: "bootstrapped", label: "Bootstrapped / Solo" },
  { value: "seed_1_10",    label: "Seed (1-10)" },
  { value: "series_a",     label: "Series A (11-50)" },
  { value: "series_b",     label: "Series B+ (50+)" },
  { value: "enterprise",   label: "Enterprise (500+)" },
  { value: "all",          label: "All sizes" },
];

interface Profile {
  full_name: string;
  avatar_url: string;
  company_name: string;
  website_url: string;
  company_description: string;
  role: string;
  icp_industries: string;
  icp_company_size: string;
  icp_location: string;
}

const EMPTY: Profile = {
  full_name: "",
  avatar_url: "",
  company_name: "",
  website_url: "",
  company_description: "",
  role: "",
  icp_industries: "",
  icp_company_size: "all",
  icp_location: "",
};

function isValidUrl(raw: string) {
  if (!raw) return true;
  try {
    new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return true;
  } catch {
    return false;
  }
}

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Profile | "avatar", string>>>({});

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveTimestamp, setSaveTimestamp] = useState<Date | undefined>();

  const fileRef = useRef<HTMLInputElement>(null);
  // Always-current profile ref to avoid stale closures in onBlur handlers
  const profileRef = useRef<Profile>(EMPTY);
  profileRef.current = profile;

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile: p, email: e }) => {
        if (e) setEmail(e);
        if (p) {
          const loaded = { ...EMPTY, ...p };
          setProfile(loaded);
          profileRef.current = loaded;
          if (p.avatar_url) setAvatarPreview(p.avatar_url);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const patch = useCallback(async (data: Partial<Profile>) => {
    setSaveStatus("saving");
    setSaveError(undefined);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        setSaveError(j.error ?? "Save failed");
        setSaveStatus("error");
      } else {
        setSaveTimestamp(new Date());
        setSaveStatus("saved");
      }
    } catch {
      setSaveError("Network error");
      setSaveStatus("error");
    }
  }, []);

  function autoSave(
    key: keyof Profile,
    validate?: () => string | undefined,
  ): () => void {
    return () => {
      if (validate) {
        const err = validate();
        setErrors((e) => ({ ...e, [key]: err }));
        if (err) return;
      } else {
        setErrors((e) => ({ ...e, [key]: undefined }));
      }
      patch({ [key]: profileRef.current[key] });
    };
  }

  function setField<K extends keyof Profile>(key: K) {
    return (v: string) => setProfile((p) => ({ ...p, [key]: v }));
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrors((er) => ({ ...er, avatar: "JPG or PNG only" }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((er) => ({ ...er, avatar: "Max 2 MB" }));
      return;
    }
    setErrors((er) => ({ ...er, avatar: undefined }));

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) {
        setSaveError("Avatar upload failed");
        setSaveStatus("error");
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      await patch({ avatar_url: publicUrl });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveAll() {
    const errs: typeof errors = {};
    if (!profileRef.current.full_name.trim()) errs.full_name = "Full name is required";
    if (profileRef.current.website_url && !isValidUrl(profileRef.current.website_url)) {
      errs.website_url = "Invalid URL format";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    await patch(profileRef.current);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Loader2 size={20} color="rgba(255,255,255,0.25)" style={{ animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ maxWidth: 900, paddingBottom: 80 }}
    >
      {/* Page header */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 40 }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "var(--font-syne)",
          letterSpacing: "-0.02em",
          margin: 0,
          lineHeight: 1.2,
        }}>
          Account Settings
        </h1>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
          fontFamily: "var(--font-outfit)",
          margin: "6px 0 0",
          lineHeight: 1.5,
        }}>
          Manage your profile and personal information
        </p>
      </motion.div>

      {/* ── SECTION 1: Personal Information ── */}
      <motion.section {...fadeUp(1)} style={{ marginBottom: 48 }}>
        <SectionHeader title="Personal Information" divider />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <motion.div {...fadeUp(2)}>
            <FormInput
              label="Email"
              description="Your login email address."
              value={email}
              onChange={() => {}}
              required
              disabled
            />
          </motion.div>

          <motion.div {...fadeUp(3)}>
            <FormInput
              label="Full Name"
              placeholder="Jane Smith"
              required
              value={profile.full_name}
              onChange={setField("full_name")}
              error={errors.full_name}
              onBlur={autoSave("full_name", () =>
                profile.full_name.trim() ? undefined : "Full name is required"
              )}
            />
          </motion.div>

          {/* Avatar upload */}
          <motion.div {...fadeUp(4)}>
            <div style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: 16,
            }}>
              <p style={{
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.7)",
                fontFamily: "var(--font-outfit)",
                marginBottom: 14,
              }}>
                Profile Photo
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Upload profile photo"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.1)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    overflow: "hidden",
                    flexShrink: 0,
                    padding: 0,
                    position: "relative",
                  }}
                >
                  {avatarPreview ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarPreview}
                      alt="Profile photo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : avatarUploading ? (
                    <Loader2 size={20} color="rgba(255,255,255,0.35)" style={{ animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <Camera size={20} color="rgba(255,255,255,0.3)" aria-hidden="true" />
                  )}
                </button>

                <div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarUploading}
                    style={{
                      display: "block",
                      padding: "7px 14px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.12)",
                      backgroundColor: "transparent",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      fontFamily: "var(--font-outfit)",
                      cursor: avatarUploading ? "not-allowed" : "pointer",
                      marginBottom: 6,
                      opacity: avatarUploading ? 0.5 : 1,
                    }}
                  >
                    {avatarUploading ? "Uploading..." : "Upload photo"}
                  </button>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-outfit)" }}>
                    JPG or PNG, max 2 MB
                  </p>
                  {errors.avatar && (
                    <p role="alert" style={{ fontSize: 11, color: "#ef4444", fontFamily: "var(--font-outfit)", marginTop: 3 }}>
                      {errors.avatar}
                    </p>
                  )}
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleAvatarFile}
                style={{ display: "none" }}
                aria-label="Profile photo file input"
              />
            </div>
          </motion.div>

        </div>
      </motion.section>

      {/* ── SECTION 2: Company Profile ── */}
      <motion.section {...fadeUp(5)} style={{ marginBottom: 48 }}>
        <SectionHeader title="Company Profile" divider />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <motion.div {...fadeUp(6)}>
            <FormInput
              label="Company Name"
              placeholder="Acme Corp"
              value={profile.company_name}
              onChange={setField("company_name")}
              onBlur={autoSave("company_name")}
            />
          </motion.div>

          <motion.div {...fadeUp(7)}>
            <FormInput
              label="Website URL"
              placeholder="https://acme.com"
              value={profile.website_url}
              onChange={setField("website_url")}
              error={errors.website_url}
              onBlur={autoSave("website_url", () =>
                isValidUrl(profileRef.current.website_url) ? undefined : "Invalid URL format"
              )}
            />
          </motion.div>

          <motion.div {...fadeUp(8)}>
            <FormTextarea
              label="Company Description"
              placeholder="Briefly describe what your company does..."
              rows={4}
              maxLength={500}
              value={profile.company_description}
              onChange={setField("company_description")}
              onBlur={autoSave("company_description")}
            />
          </motion.div>

          <motion.div {...fadeUp(9)}>
            <FormInput
              label="Your Role"
              placeholder="Founder, Head of Sales..."
              value={profile.role}
              onChange={setField("role")}
              onBlur={autoSave("role")}
            />
          </motion.div>

        </div>
      </motion.section>

      {/* ── SECTION 3: ICP ── */}
      <motion.section {...fadeUp(10)} style={{ marginBottom: 48 }}>
        <SectionHeader
          title="ICP (Ideal Customer Profile)"
          description="Help us identify better signals by telling us who you target"
          divider
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <motion.div {...fadeUp(11)}>
            <FormTextarea
              label="Industry Keywords"
              description="Separate with commas"
              placeholder="SaaS, B2B, Fintech, eCommerce..."
              rows={3}
              maxLength={500}
              value={profile.icp_industries}
              onChange={setField("icp_industries")}
              onBlur={autoSave("icp_industries")}
            />
          </motion.div>

          <motion.div {...fadeUp(12)}>
            <FormSelect
              label="Target Company Size"
              options={SIZE_OPTIONS}
              value={profile.icp_company_size}
              onChange={(v) => {
                setProfile((p) => ({ ...p, icp_company_size: v }));
                patch({ icp_company_size: v });
              }}
            />
          </motion.div>

          <motion.div {...fadeUp(13)}>
            <FormInput
              label="Location Focus"
              placeholder="US, UK, Europe, Global..."
              value={profile.icp_location}
              onChange={setField("icp_location")}
              onBlur={autoSave("icp_location")}
            />
          </motion.div>

        </div>
      </motion.section>

      {/* ── Footer ── */}
      <motion.div
        {...fadeUp(14)}
        style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 4 }}
      >
        <button
          onClick={handleSaveAll}
          disabled={saveStatus === "saving"}
          style={{
            width: 120,
            padding: "9px 0",
            borderRadius: 7,
            backgroundColor: "#FF5200",
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "var(--font-outfit)",
            border: "none",
            cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
            opacity: saveStatus === "saving" ? 0.7 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            transition: "filter 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (saveStatus !== "saving")
              (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = "none";
          }}
        >
          {saveStatus === "saving" && (
            <Loader2 size={13} strokeWidth={2} style={{ animation: "spin 0.8s linear infinite" }} />
          )}
          {saveStatus === "saving" ? "Saving..." : "Save Changes"}
        </button>

        <SaveStatus status={saveStatus} message={saveError} timestamp={saveTimestamp} />
      </motion.div>
    </motion.div>
  );
}
