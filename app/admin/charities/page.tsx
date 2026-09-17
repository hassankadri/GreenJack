import Link from "next/link";
import {
  Heart,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  createCharity,
  deleteCharity,
  updateCharity,
} from "@/actions/charity-admin";
import BackButton from "../../../components/BackButton";

type AdminCharitiesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminCharitiesPage({
  searchParams,
}: AdminCharitiesPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: charities } = await supabase
    .from("charities")
    .select(
      "id, name, slug, description, image_url, website_url, is_active, featured",
    )
    .order("featured", { ascending: false })
    .order("name");

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

        <section className="pt-10">
          <p className="dh-eyebrow text-zinc-500">
            Charity management
          </p>

          <h1 className="dh-display mt-4 max-w-5xl text-6xl sm:text-7xl">
            Shape the directory.
            <br />
            <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
              Tell better stories.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
            Add, edit and manage the causes shown across the GreenJack
            platform.
          </p>
        </section>

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {params.success === "created" &&
              "Charity created successfully."}

            {params.success === "updated" &&
              "Charity updated successfully."}

            {params.success === "deleted" &&
              "Charity deleted successfully."}
          </div>
        )}

        <section className="mt-10">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dh-sage)] text-zinc-900">
                <Plus className="h-5 w-5" />
              </div>

              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Add a cause
                </p>

                <h2 className="mt-2 text-3xl font-semibold">
                  Create charity
                </h2>
              </div>
            </div>

            <form action={createCharity} className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="create-name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Name
                  </label>

                  <input
                    id="create-name"
                    name="name"
                    required
                    placeholder="Future Education Fund"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="create-slug"
                    className="mb-2 block text-sm font-medium"
                  >
                    Slug
                  </label>

                  <input
                    id="create-slug"
                    name="slug"
                    required
                    placeholder="future-education-fund"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="create-description"
                  className="mb-2 block text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="create-description"
                  name="description"
                  required
                  rows={4}
                  placeholder="Tell members what this cause supports."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="create-image"
                    className="mb-2 block text-sm font-medium"
                  >
                    Image URL
                  </label>

                  <input
                    id="create-image"
                    name="imageUrl"
                    type="url"
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="create-website"
                    className="mb-2 block text-sm font-medium"
                  >
                    Website URL
                  </label>

                  <input
                    id="create-website"
                    name="websiteUrl"
                    type="url"
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  name="featured"
                  className="h-4 w-4"
                />
                Feature this charity
              </label>

              <div>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--dh-sage)] px-6 py-3 text-sm font-semibold text-zinc-900"
                >
                  Create charity
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="dh-eyebrow text-zinc-500">
                Directory
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                Existing charities
              </h2>
            </div>

            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-zinc-400">
              {charities?.length ?? 0} causes
            </span>
          </div>

          <div className="space-y-5">
            {(charities ?? []).map((charity) => (
              <article
                key={charity.id}
                className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 sm:p-8"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:justify-between">
                  <div className="flex min-w-0 gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Heart className="h-5 w-5 text-[var(--dh-sage)]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-2xl font-semibold">
                          {charity.name}
                        </h3>

                        {charity.featured && (
                          <span className="rounded-full bg-[var(--dh-sage)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-900">
                            Featured
                          </span>
                        )}

                        {!charity.is_active && (
                          <span className="rounded-full bg-red-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-red-300">
                            Inactive
                          </span>
                        )}
                      </div>

                      <p className="mt-2 break-all text-sm text-zinc-500">
                        /{charity.slug}
                      </p>

                      <p className="mt-4 max-w-2xl break-words text-sm leading-6 text-zinc-400">
                        {charity.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-3">
                    <Link
                      href={`/charities/${charity.id}`}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                    >
                      View
                    </Link>

                    <form action={deleteCharity}>
                      <input
                        type="hidden"
                        name="id"
                        value={charity.id}
                      />

                      <button
                        type="submit"
                        className="flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                <details className="mt-7 border-t border-white/10 pt-6">
                  <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-300">
                    <Pencil className="h-4 w-4" />
                    Edit charity
                  </summary>

                  <form
                    action={updateCharity}
                    className="mt-6 space-y-5"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={charity.id}
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Name
                        </label>

                        <input
                          name="name"
                          defaultValue={charity.name}
                          required
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Slug
                        </label>

                        <input
                          name="slug"
                          defaultValue={charity.slug}
                          required
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Description
                      </label>

                      <textarea
                        name="description"
                        defaultValue={charity.description}
                        required
                        rows={4}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Image URL
                        </label>

                        <input
                          name="imageUrl"
                          type="url"
                          defaultValue={charity.image_url ?? ""}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Website URL
                        </label>

                        <input
                          name="websiteUrl"
                          type="url"
                          defaultValue={charity.website_url ?? ""}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <label className="inline-flex items-center gap-3 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          name="featured"
                          defaultChecked={charity.featured}
                          className="h-4 w-4"
                        />
                        Featured
                      </label>

                      <label className="inline-flex items-center gap-3 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={charity.is_active}
                          className="h-4 w-4"
                        />
                        Active
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900"
                    >
                      Save changes
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
