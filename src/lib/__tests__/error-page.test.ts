import { describe, it, expect } from "vitest";
import { renderErrorPage } from "../error-page";

describe("renderErrorPage", () => {
  it("returns a valid HTML string", () => {
    const html = renderErrorPage();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("</html>");
  });

  it("contains the error title", () => {
    const html = renderErrorPage();
    expect(html).toContain("This page didn't load");
  });

  it("includes a retry button", () => {
    const html = renderErrorPage();
    expect(html).toContain("Try again");
    expect(html).toContain("location.reload()");
  });

  it("includes a link to go home", () => {
    const html = renderErrorPage();
    expect(html).toContain('href="/"');
    expect(html).toContain("Go home");
  });

  it("contains proper meta tags", () => {
    const html = renderErrorPage();
    expect(html).toContain('charset="utf-8"');
    expect(html).toContain("viewport");
  });
});
