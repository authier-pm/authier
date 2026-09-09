import { expect, it } from "vitest";
import { describeApiError } from "./errorDiagnostics";

it("logs crypto failures while excluding query parameters and arbitrary error payloads", () => {
  const cause = new DOMException(
    "Pbkdf2 iteration count is unsupported",
    "NotSupportedError",
  );
  const failure = new Error("SQL params: private-enrollment-secret", { cause });
  const details = JSON.stringify(describeApiError(failure));
  expect(details).toContain("NotSupportedError");
  expect(details).toContain("Pbkdf2 iteration count is unsupported");
  expect(details).not.toContain("private-enrollment-secret");
});
