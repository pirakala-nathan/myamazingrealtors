"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { saveManualListing, uploadListingPhoto, type AdminFormState } from "@/app/actions/admin";
import { HouseLoader } from "@/components/ui/house-loader";
import { AddressInput } from "./address-input";
import { MAX_MANUAL_PHOTOS, type Listing } from "@/lib/listings/types";

const initial: AdminFormState = { status: "idle" };

const PROPERTY_TYPES = [
  "Detached",
  "Semi-Detached",
  "Freehold Townhouse",
  "Condo Townhouse",
  "Condo Apartment",
  "Link",
  "Bungalow",
];
/** TRREB's square-footage ranges, as MLS® listings show them. */
const SIZE_RANGES = ["< 700", "700-1100", "1100-1500", "1500-2000", "2000-2500", "2500-3000", "3000-3500", "3500-5000", "5000 +"];
/** The options, plus an older listing's value if it isn't one of them, so editing doesn't lose it. */
const withCurrent = (options: string[], current?: string | null) =>
  current && !options.includes(current) ? [...options, current] : options;
const MAX_EDGE = 2000; // px; photos are resized in the browser before upload

const input =
  "w-full rounded-none border border-cloud-400 bg-white px-4 py-3 text-base text-ink focus:border-navy-900 focus:outline-none aria-[invalid=true]:border-red-700";

/** Resizes a photo to at most 2000px on its long edge and re-encodes it as JPEG. */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.85),
  );
}

function Field({
  name,
  label,
  hint,
  state,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  state: AdminFormState;
  children: React.ReactNode;
}) {
  const error = state.fieldErrors?.[name]?.[0];
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`m-${name}`} className="text-sm font-bold">
        {label} {hint && <span className="font-medium text-muted">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`m-${name}-error`} className="text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

export function ManualListingForm({ listing, cities }: { listing?: Listing; cities: readonly string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [photos, setPhotos] = useState<string[]>(listing?.photos ?? []);
  const [status, setStatus] = useState<string>(listing?.status ?? "sold");
  const [upload, setUpload] = useState<{
    done: number;
    total: number;
    errors: string[];
  } | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [dragging, setDragging] = useState<number | null>(null);
  // Bumped after a new listing is saved, to clear the address field (which keeps its own value).
  const [resetCount, setResetCount] = useState(0);

  /** Moves the photo at `from` to position `to` (0 is the cover). */
  const movePhoto = (from: number, to: number) =>
    setPhotos((p) => {
      if (to < 0 || to >= p.length) return p;
      const next = [...p];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const [state, action] = useActionState(async (prev: AdminFormState, fd: FormData) => {
    const result = await saveManualListing(prev, fd);
    if (result.status === "success" && !listing) {
      formRef.current?.reset();
      setPhotos([]);
      setStatus("sold");
      setUpload(null);
      setResetCount((n) => n + 1);
    }
    return result;
  }, initial);

  const err = (name: string) =>
    state.fieldErrors?.[name] ? { "aria-invalid": true, "aria-describedby": `m-${name}-error` } : {};

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_MANUAL_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    const errors: string[] = [];
    if (files.length > list.length) {
      errors.push(
        room > 0
          ? `Up to ${MAX_MANUAL_PHOTOS} photos per listing, so only the first ${room} you picked were added.`
          : `This listing already has ${MAX_MANUAL_PHOTOS} photos. Remove one to add another.`,
      );
    }
    if (list.length === 0) {
      setUpload({ done: 0, total: 0, errors });
      return;
    }
    setUpload({ done: 0, total: list.length, errors });
    for (const [i, file] of list.entries()) {
      try {
        const blob = await resize(file);
        const fd = new FormData();
        fd.append(
          "photo",
          new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
            type: "image/jpeg",
          }),
        );
        const res = await uploadListingPhoto(fd);
        if (res.url) setPhotos((p) => [...p, res.url!]);
        else errors.push(res.error ?? `${file.name} couldn’t be uploaded.`);
      } catch {
        errors.push(`${file.name} couldn’t be read. Try a JPG or PNG.`);
      }
      setUpload({ done: i + 1, total: list.length, errors: [...errors] });
    }
  }

  const uploading = upload !== null && upload.done < upload.total;
  const sold = status === "sold" || status === "leased";

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startSubmit(() => action(fd));
      }}
      className="flex flex-col gap-6"
    >
      {listing && <input type="hidden" name="originalMlsNumber" value={listing.mlsNumber} />}
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="street" label="Street address" hint="(start typing to pick the address)" state={state}>
          <AddressInput
            key={resetCount}
            defaultValue={listing?.street ?? ""}
            className={input}
            inputProps={{ id: "m-street", name: "street", placeholder: "27 Aldgate Crescent", ...err("street") }}
            onPick={(address) => {
              // Fill the city and postal code from the address PK picked.
              const city = formRef.current?.elements.namedItem("city");
              const postal = formRef.current?.elements.namedItem("postalCode");
              if (city instanceof HTMLInputElement && address.city) city.value = address.city;
              if (postal instanceof HTMLInputElement && address.postalCode) postal.value = address.postalCode;
            }}
          />
        </Field>
        <Field name="city" label="City" state={state}>
          <input
            id="m-city"
            name="city"
            list="m-city-list"
            defaultValue={listing?.city ?? ""}
            placeholder="Pickering"
            className={input}
            {...err("city")}
          />
          <datalist id="m-city-list">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field name="mlsNumber" label="MLS® number" state={state}>
          <input
            id="m-mlsNumber"
            name="mlsNumber"
            defaultValue={listing?.mlsNumber ?? ""}
            placeholder="E12345678"
            autoCapitalize="characters"
            className={`${input} uppercase`}
            {...err("mlsNumber")}
          />
        </Field>
        <Field name="postalCode" label="Postal code" hint="(optional)" state={state}>
          <input
            id="m-postalCode"
            name="postalCode"
            defaultValue={listing?.postalCode ?? ""}
            className={`${input} uppercase`}
            {...err("postalCode")}
          />
        </Field>
        <Field name="status" label="Status" state={state}>
          <select
            id="m-status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={input}
          >
            <option value="active">For sale (active)</option>
            <option value="pending">Sold conditional</option>
            <option value="sold">Sold</option>
            <option value="leased">Leased</option>
            <option value="purchased">Purchased (I represented the buyer)</option>
            <option value="off-market">Off market</option>
          </select>
        </Field>
        <Field name="transactionType" label="Type" state={state}>
          <select
            id="m-transactionType"
            name="transactionType"
            defaultValue={listing?.transactionType ?? "For Sale"}
            className={input}
          >
            <option>For Sale</option>
            <option>For Lease</option>
          </select>
        </Field>
        <Field
          name="listPrice"
          label="List price"
          hint={sold || status === "purchased" ? "(shown only while for sale)" : "(per month for leases)"}
          state={state}
        >
          <input
            id="m-listPrice"
            name="listPrice"
            inputMode="numeric"
            defaultValue={listing?.listPrice ?? ""}
            placeholder="899900"
            className={input}
            {...err("listPrice")}
          />
        </Field>
        <Field name="propertyType" label="Property type" state={state}>
          <select
            id="m-propertyType"
            name="propertyType"
            defaultValue={listing ? (listing.propertyType ?? "") : "Detached"}
            className={input}
          >
            <option value="">Not specified</option>
            {withCurrent(PROPERTY_TYPES, listing?.propertyType).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field name="bedrooms" label="Bedrooms" hint="(e.g. 3 + 1)" state={state}>
          <input
            id="m-bedrooms"
            name="bedrooms"
            defaultValue={listing?.bedrooms ?? ""}
            className={input}
            {...err("bedrooms")}
          />
        </Field>
        <Field name="bathrooms" label="Bathrooms" state={state}>
          <input
            id="m-bathrooms"
            name="bathrooms"
            inputMode="decimal"
            defaultValue={listing?.bathrooms ?? ""}
            className={input}
            {...err("bathrooms")}
          />
        </Field>
        <Field name="sizeRange" label="Size (sq ft)" hint="(optional)" state={state}>
          <select id="m-sizeRange" name="sizeRange" defaultValue={listing?.sizeRange ?? ""} className={input}>
            <option value="">Not specified</option>
            {withCurrent(SIZE_RANGES, listing?.sizeRange).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        {status === "purchased" && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Field name="listOffice" label="Listing brokerage" hint="(credited on the listing page)" state={state}>
              <input
                id="m-listOffice"
                name="listOffice"
                defaultValue={listing?.status === "purchased" ? (listing.listOffice ?? "") : ""}
                placeholder="e.g. Royal LePage Signature Realty"
                className={input}
                {...err("listOffice")}
              />
            </Field>
            <p className="border-l-4 border-aqua-500 bg-aqua-100 px-4 py-3 text-sm text-body">
              Use your own photos, or ones you have permission to use. MLS® photos from another brokerage’s listing
              belong to that brokerage.
            </p>
          </div>
        )}
        {sold && (
          <label className="flex items-center gap-3 self-end py-3 text-sm font-bold">
            <input
              type="checkbox"
              name="soldOverAsking"
              defaultChecked={listing?.soldOverAsking ?? false}
              className="size-5 accent-navy-900"
            />
            Show a “Sold over asking” badge
          </label>
        )}
      </div>

      <Field name="description" label="Description" hint="(optional)" state={state}>
        <textarea
          id="m-description"
          name="description"
          rows={5}
          defaultValue={listing?.description ?? ""}
          className={input}
        />
      </Field>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-bold">
          Photos{" "}
          <span className="font-medium text-muted">
            ({photos.length} of {MAX_MANUAL_PHOTOS}; the first photo is the cover; use photos you have the rights to)
          </span>
        </span>
        {photos.length > 0 && (
          <>
            <p className="text-xs text-muted">
              Drag photos to put them in order, or use the ← → buttons. The first one is the cover.
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {photos.map((url, i) => (
                <li
                  key={url}
                  draggable
                  onDragStart={(e) => {
                    setDragging(i);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragging !== null && dragging !== i) {
                      movePhoto(dragging, i);
                      setDragging(i);
                    }
                  }}
                  onDragEnd={() => setDragging(null)}
                  onDrop={(e) => e.preventDefault()}
                  className={`flex cursor-grab flex-col gap-1.5 transition-opacity active:cursor-grabbing ${dragging === i ? "opacity-40" : ""}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-cloud-300">
                    {/* Admin preview of an uploaded photo. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                    <span className="absolute left-2 top-2 bg-navy-900 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-aqua-400">
                      {i === 0 ? "Cover" : i + 1}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      disabled={i === 0}
                      aria-label={`Move photo ${i + 1} earlier`}
                      className="min-w-8 border border-navy-900 px-2 py-1 disabled:opacity-30"
                      onClick={() => movePhoto(i, i - 1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={i === photos.length - 1}
                      aria-label={`Move photo ${i + 1} later`}
                      className="min-w-8 border border-navy-900 px-2 py-1 disabled:opacity-30"
                      onClick={() => movePhoto(i, i + 1)}
                    >
                      →
                    </button>
                    {i > 0 && (
                      <button
                        type="button"
                        className="border border-navy-900 px-2 py-1"
                        onClick={() => setPhotos((p) => [url, ...p.filter((u) => u !== url)])}
                      >
                        Make cover
                      </button>
                    )}
                    <button
                      type="button"
                      className="border border-red-800 px-2 py-1 text-red-800"
                      onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        <label className="inline-flex min-h-12 cursor-pointer items-center justify-center self-start border-[1.5px] border-navy-900 px-6 font-bold hover:bg-navy-900 hover:text-on-dark has-[:disabled]:cursor-wait has-[:disabled]:opacity-60">
          {uploading ? (
            <span className="flex items-center gap-2">
              <HouseLoader size="sm" showLabel={false} label="Uploading photos" className="[&_svg]:w-6" />
              {`Uploading ${upload!.done + 1} of ${upload!.total}…`}
            </span>
          ) : photos.length >= MAX_MANUAL_PHOTOS ? (
            `${MAX_MANUAL_PHOTOS} photos added (maximum)`
          ) : (
            "Add photos"
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            disabled={uploading || photos.length >= MAX_MANUAL_PHOTOS}
            className="sr-only"
            onChange={(e) => {
              addPhotos(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {upload?.errors.map((m) => (
          <p key={m} role="alert" className="text-sm font-semibold text-red-800">
            {m}
          </p>
        ))}
        {state.fieldErrors?.photos && (
          <p className="text-sm font-semibold text-red-800">{state.fieldErrors.photos[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="min-h-12 rounded-none bg-navy-900 px-8 font-bold text-on-dark hover:bg-navy-700 disabled:opacity-70"
        >
          {submitting ? "Saving…" : listing ? "Save changes" : "Add listing"}
        </button>
        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`text-sm font-semibold ${state.status === "error" ? "text-red-800" : "text-aqua-700"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
