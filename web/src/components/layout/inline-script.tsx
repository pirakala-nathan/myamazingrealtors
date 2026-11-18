/**
 * Runs a small script synchronously while the HTML is parsed, before first paint
 * (Next.js guide: "How to prevent flash before hydration"). The type switch stops React's
 * development warning about rendering <script> tags on the client.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
