import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as database from "./prisma/prismaClient";
import { sendEmail, type EmailBindings } from "./utils/email";
import worker from "./worker";

const { fetchHandler, processResets, purgeCodes } = vi.hoisted(() => ({
  fetchHandler: vi.fn<(request: Request) => Promise<Response>>(),
  processResets: vi.fn<() => Promise<void>>(),
  purgeCodes: vi.fn<() => Promise<number>>(),
}));

vi.mock("./app", () => ({
  buildApp: () => ({ compile: () => ({ fetch: fetchHandler }) }),
}));

vi.mock("./lib/processPendingMasterDeviceResets", () => ({
  processPendingMasterDeviceResets: processResets,
}));

vi.mock("./lib/relayedVerificationCodes", () => ({
  purgeExpiredRelayedCodes: purgeCodes,
}));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DISABLE_EMAIL_SENDING", "false");
  vi.spyOn(database, "withDatabase").mockImplementation(async (_, work) =>
    work(),
  );
  purgeCodes.mockResolvedValue(0);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe("Worker email binding lifecycle", () => {
  const content = { subject: "Notification", text: "Account notification" };
  const createBindings = () => ({
    EMAIL: {
      send: vi
        .fn<NonNullable<EmailBindings["EMAIL"]>["send"]>()
        .mockResolvedValue({ messageId: "worker-message-id" }),
    },
  });

  it("makes the binding available to HTTP request handlers", async () => {
    const bindings = createBindings();
    const request = new Request("https://api.authier.pm/graphql");
    fetchHandler.mockImplementationOnce(async () => {
      await sendEmail("user@example.com", content);
      return new Response("sent");
    });

    const response = await worker.fetch(request, bindings);

    expect(await response.text()).toBe("sent");
    expect(fetchHandler).toHaveBeenCalledWith(request);
    expect(bindings.EMAIL.send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ to: "user@example.com", ...content }),
    );
  });

  it("makes the binding available to scheduled recovery processing", async () => {
    const bindings = createBindings();
    processResets.mockImplementationOnce(async () => {
      await sendEmail("backup@example.com", content);
    });

    await worker.scheduled({}, bindings);

    expect(bindings.EMAIL.send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ to: "backup@example.com", ...content }),
    );
    expect(purgeCodes).toHaveBeenCalledOnce();
  });
});
