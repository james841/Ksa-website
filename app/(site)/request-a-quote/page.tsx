import { permanentRedirect } from "next/navigation";

/**
 * The old "Request a quote" address. The wording is now "Request a service",
 * so anyone with the old link (or an old search result) is sent to the new
 * page. next.config.ts also redirects this path before it reaches here; this
 * file is the belt-and-braces version so the old address can never show the
 * old wording.
 */
export default function RequestAQuote(): never {
  permanentRedirect("/request-a-service");
}
