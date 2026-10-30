import { describe, expect, it } from "vitest";
import { StylingRequestSchema } from "@/lib/validation/request";

const firstError = (input: Record<string, string>) => {
  const result = StylingRequestSchema.safeParse(input);
  return result.success ? null : result.error.issues[0];
};

describe("StylingRequestSchema", () => {
  it("requires a real title — whitespace alone is not one", () => {
    // `required` on the input blocks "", but "   " gets through the browser.
    expect(firstError({ title: "   " })).toMatchObject({
      path: ["title"],
      message: "titleRequired",
    });
  });

  it("only accepts known occasion codes, and treats an empty select as unset", () => {
    expect(firstError({ title: "Wedding", occasion: "rave" })).toMatchObject({
      path: ["occasion"],
      message: "invalidValue",
    });
    const ok = StylingRequestSchema.parse({ title: "Wedding", occasion: "" });
    expect(ok.occasion).toBeUndefined();
  });

  it("rejects an event time that is not datetime-local shaped", () => {
    // Server actions are reachable by direct POST, so the form's input type
    // is no guarantee of the value's shape.
    expect(firstError({ title: "Wedding", eventAt: "next friday" })).toMatchObject({
      path: ["eventAt"],
      message: "eventAtInvalid",
    });
  });
});
