import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("SetupPage entrypoint styles", () => {
  it("includes full-width layout rules", () => {
    const cssPath = resolve(process.cwd(), "entrypoints/setup/style.css");
    const css = readFileSync(cssPath, "utf8");

    expect(css).toMatch(/body\s*\{[^}]*min-height:\s*100vh;/s);
    expect(css).toMatch(/#app\s*\{[^}]*width:\s*100%;/s);
    expect(css).toMatch(
      /\.setup-page-shell\s*\{[^}]*width:\s*min\(1200px,\s*100%\);/s,
    );
    expect(css).toMatch(
      /\.settings-layout\s*\{[^}]*grid-template-columns:\s*minmax\(260px,\s*360px\)\s+minmax\(0,\s*1fr\);/s,
    );
    expect(css).toMatch(/@media\s*\(max-width:\s*900px\)/s);
  });
});
