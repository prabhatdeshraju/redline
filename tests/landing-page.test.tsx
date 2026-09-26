import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import LandingPage from "@/app/page";

function markup(): string {
  return renderToStaticMarkup(<LandingPage />);
}

describe("landing page", () => {
  it("renders the landmarks of the shipped design", () => {
    const html = markup();

    expect(html).toContain("Schedule of flags");
    expect(html).toContain("Highest severity");
    expect(html).toContain("Key to the marks");
    expect(html).toContain("Limitations of this inspection");
    expect(html).toContain("Bring the document you are about to sign.");
  });

  it("quotes every flag's source sentence verbatim in a blockquote", () => {
    const html = markup();
    const quotes = html.match(
      /<blockquote class="source__quote"><p>(.*?)<\/p><\/blockquote>/g,
    );

    expect(quotes).toHaveLength(3);
    expect(quotes?.[0]).toContain(
      "The Contractor personally and unconditionally guarantees",
    );
    expect(quotes?.[1]).toContain(
      "shall indemnify, defend and hold harmless the Client",
    );
    expect(quotes?.[2]).toContain("is a work made for hire");
  });

  it("serves the no-JS baseline: the lead flag is expanded, no body hidden", () => {
    const html = markup();

    expect(html).toContain('aria-expanded="true"');
    // no collapsed body in the baseline markup (aria-hidden does not count)
    expect(html).not.toMatch(/\shidden[=>\s]/);
    expect((html.match(/class="flag__body"/g) ?? []).length).toBe(3);
  });

  it("points both inspect links at the /workspace route", () => {
    const html = markup();

    expect((html.match(/href="\/workspace"/g) ?? []).length).toBe(2);
    expect(html).not.toContain("workspace/index.html");
  });
});
