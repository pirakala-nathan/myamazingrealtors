import "server-only";

/**
 * Address autocomplete for the admin "add a listing by hand" form, using Google's Places API (New):
 * Autocomplete for suggestions while typing, then Place Details for the chosen address's parts.
 * https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
 *
 * Uses the same GOOGLE_PLACES_API_KEY as the Google reviews, called from the server so the key never
 * reaches the browser. A session token groups one typing session with its final lookup, which Google
 * bills as a single session. Admin-only use stays well inside Google's free monthly allowance.
 */

export type AddressSuggestion = { placeId: string; main: string; secondary: string };
export type AddressParts = { street: string; city: string; postalCode: string | null };

const key = () => process.env.GOOGLE_PLACES_API_KEY ?? "";

/** Suggestions for what's been typed, Canadian addresses only, favouring Durham and the East GTA. */
export async function suggestAddresses(input: string, sessionToken: string): Promise<AddressSuggestion[]> {
  const apiKey = key();
  if (!apiKey || input.trim().length < 3) return [];
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
    body: JSON.stringify({
      input: input.trim().slice(0, 120),
      sessionToken,
      includedRegionCodes: ["ca"],
      // Centred between Pickering and Whitby; a bias, not a limit, so Toronto and Markham still come up.
      locationBias: { circle: { center: { latitude: 43.86, longitude: -79.0 }, radius: 50000 } },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    console.error(`[address-lookup] autocomplete ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return [];
  }
  const body = (await res.json()) as {
    suggestions?: {
      placePrediction?: {
        placeId?: string;
        structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
      };
    }[];
  };
  return (body.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.placeId))
    .map((p) => ({
      placeId: p.placeId!,
      main: p.structuredFormat?.mainText?.text ?? "",
      secondary: p.structuredFormat?.secondaryText?.text ?? "",
    }))
    .slice(0, 5);
}

type Component = { longText?: string; shortText?: string; types?: string[] };

/** The chosen address split into the form's fields: "Unit - number street", city, postal code. */
export async function addressDetails(placeId: string, sessionToken: string): Promise<AddressParts | null> {
  const apiKey = key();
  if (!apiKey || !/^[\w-]{10,300}$/.test(placeId)) return null;
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`,
    {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "addressComponents" },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) {
    console.error(`[address-lookup] details ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return null;
  }
  const { addressComponents = [] } = (await res.json()) as { addressComponents?: Component[] };
  const part = (type: string) => addressComponents.find((c) => c.types?.includes(type));

  const number = part("street_number")?.longText;
  const route = part("route")?.longText;
  // "unit 68", "Apt 4", "Suite 200" → "68", "4", "200", to match the MLS® style "68 - 2758 Eglinton…".
  const unit = part("subpremise")?.longText?.replace(/^(unit|apt\.?|apartment|suite|ste\.?|#)\s*/i, "").trim() || undefined;
  if (!route) return null;
  const line = [number, route].filter(Boolean).join(" ");

  // Toronto addresses list the old city (Scarborough, North York…) as a sublocality; listings use that name.
  const locality = part("locality")?.longText ?? "";
  const sublocality = part("sublocality_level_1")?.longText ?? part("sublocality")?.longText;
  const city = locality === "Toronto" && sublocality ? sublocality : locality || sublocality || "";

  return {
    street: unit ? `${unit} - ${line}` : line,
    city,
    postalCode: part("postal_code")?.longText ?? null,
  };
}
