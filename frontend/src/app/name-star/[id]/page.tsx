"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { Star } from "@/types";

const DEDICATION_TYPES = [
  "In Memory Of", "Dedicated To", "Self", "Gift", "Birthday",
  "Anniversary", "Wedding", "Graduation", "New Born Baby",
  "Friendship", "Parents", "Spiritual Dedication", "Teacher / Mentor",
  "Corporate Gift", "Custom Dedication",
];

const schema = z.object({
  requested_name: z.string().min(2).max(100),
  dedication_type: z.string().min(1),
  dedication_message: z.string().max(1000).optional(),
  recipient_name: z.string().optional(),
  applicant_name: z.string().min(1),
  relationship: z.string().optional(),
  occasion: z.string().optional(),
  validity_plan: z.enum(["1year", "5years", "lifetime"]),
  visibility_preference: z.enum(["Public", "Private", "Link Only"]),
  consent: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});

type FormData = z.infer<typeof schema>;

export default function NamingFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [star, setStar] = useState<Star | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      validity_plan: "1year",
      visibility_preference: "Public",
      applicant_name: user?.full_name || "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/name-star/${id}`);
      return;
    }
    api.get(`/stars/${id}`).then((res) => setStar(res.data)).catch(() => {});
  }, [id, isAuthenticated, router]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await api.post(`/stars/${id}/apply`, {
        requested_name: data.requested_name,
        dedication_type: data.dedication_type,
        dedication_message: data.dedication_message,
        recipient_name: data.recipient_name,
        applicant_name: data.applicant_name,
        relationship: data.relationship,
        occasion: data.occasion,
        validity_plan: data.validity_plan,
        visibility_preference: data.visibility_preference,
      });
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setApiError(err?.response?.data?.detail || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-6">🌟</div>
        <h1 className="text-2xl font-bold text-star-white mb-3">Request Submitted!</h1>
        <p className="text-white/60 mb-8 max-w-sm">
          Your star naming request has been received. Our team will review it and notify you once approved.
        </p>
        <Link href="/dashboard" className="btn-primary px-8 py-4">View My Requests</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-950 text-star-white">
      <div className="sticky top-0 z-20 bg-space-950/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center gap-4">
        <Link href={`/stars/${id}`} className="text-white/50">←</Link>
        <h1 className="font-bold text-lg">Name This Star</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {star && (
          <div className="glass-panel p-4 mb-6">
            <div className="text-star-blue text-sm">{star.constellation}</div>
            <div className="font-bold">{star.common_name || star.scientific_name || star.catalog_id}</div>
            <div className="text-white/40 text-xs mt-1">{star.star_type} · Magnitude {star.magnitude}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="form-label">Star Name *</label>
            <input {...register("requested_name")} placeholder="Enter custom star name" className="form-input" />
            {errors.requested_name && <p className="text-red-400 text-xs mt-1">{errors.requested_name.message}</p>}
          </div>

          <div>
            <label className="form-label">Dedication Type *</label>
            <select {...register("dedication_type")} className="form-select">
              <option value="">Select dedication type</option>
              {DEDICATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.dedication_type && <p className="text-red-400 text-xs mt-1">{errors.dedication_type.message}</p>}
          </div>

          <div>
            <label className="form-label">Recipient Name</label>
            <input {...register("recipient_name")} placeholder="Who is this star for?" className="form-input" />
          </div>

          <div>
            <label className="form-label">Your Name *</label>
            <input {...register("applicant_name")} placeholder="Your full name" className="form-input" />
            {errors.applicant_name && <p className="text-red-400 text-xs mt-1">{errors.applicant_name.message}</p>}
          </div>

          <div>
            <label className="form-label">Relationship</label>
            <input {...register("relationship")} placeholder="e.g. Mother, Friend, Partner" className="form-input" />
          </div>

          <div>
            <label className="form-label">Occasion</label>
            <input {...register("occasion")} placeholder="e.g. Birthday, Anniversary" className="form-input" />
          </div>

          <div>
            <label className="form-label">Dedication Message</label>
            <textarea
              {...register("dedication_message")}
              placeholder="Write a personal message (max 1000 characters)"
              rows={4}
              className="form-input resize-none"
            />
          </div>

          <div>
            <label className="form-label">Validity Period *</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "1year", label: "1 Year" },
                { value: "5years", label: "5 Years" },
                { value: "lifetime", label: "Lifetime" },
              ].map((opt) => (
                <label key={opt.value} className="cursor-pointer">
                  <input type="radio" value={opt.value} {...register("validity_plan")} className="sr-only peer" />
                  <div className="border border-white/20 rounded-xl p-3 text-center text-sm peer-checked:border-star-blue peer-checked:bg-star-blue/10 transition-colors">
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Visibility</label>
            <select {...register("visibility_preference")} className="form-select">
              <option value="Public">Public — visible to anyone</option>
              <option value="Link Only">Link Only — shareable via link</option>
              <option value="Private">Private — only you can see</option>
            </select>
          </div>

          {/* Disclaimer */}
          <div className="bg-space-800/60 border border-white/10 rounded-xl p-4 text-xs text-white/40 leading-relaxed">
            Custom star names in AR Star Registry are ceremonial and recorded only in this private
            registry. They do not replace official astronomical names recognized by the International
            Astronomical Union.
          </div>

          <div className="flex items-start gap-3">
            <input type="checkbox" id="consent" {...register("consent")} className="mt-1 flex-shrink-0" />
            <label htmlFor="consent" className="text-sm text-white/60 cursor-pointer">
              I understand that this star naming is ceremonial and agree to the terms of service.
            </label>
          </div>
          {errors.consent && <p className="text-red-400 text-xs">{errors.consent.message}</p>}

          {apiError && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Naming Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
