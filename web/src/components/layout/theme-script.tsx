import { InlineScript } from "@/components/layout/inline-script";

/** localStorage key for the visitor's choice ("light" or "dark"). */
export const THEME_KEY = "mar-theme";

/**
 * Sets the theme on <html> before the first paint, so there's no flash of the wrong theme:
 * the visitor's saved choice, otherwise their device setting. Until they choose, the site also
 * follows the device if its setting changes (e.g. automatic dark mode at sunset).
 */
export function ThemeScript() {
  return (
    <InlineScript
      html={`(function(){var d=document.documentElement,k="${THEME_KEY}",m=window.matchMedia("(prefers-color-scheme: dark)"),s=null;try{s=localStorage.getItem(k)}catch(e){}d.setAttribute("data-theme",s==="dark"||s==="light"?s:m.matches?"dark":"light");try{m.addEventListener("change",function(e){var c=null;try{c=localStorage.getItem(k)}catch(x){}if(c!=="dark"&&c!=="light")d.setAttribute("data-theme",e.matches?"dark":"light")})}catch(e){}})();`}
    />
  );
}
