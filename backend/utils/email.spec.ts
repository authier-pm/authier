import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendEmail,
  sentEmails,
  withEmailSending,
  type EmailBindings,
} from "./email";

const content = {
  subject: "Verify your email",
  text: "Verify at https://authier.pm/verify?token=test",
  html: '<a href="https://authier.pm/verify?token=test">Verify</a>',
};

const createSender = () =>
  vi
    .fn<NonNullable<EmailBindings["EMAIL"]>["send"]>()
    .mockResolvedValue({ messageId: "cloudflare-message-id" });

beforeEach(() => {
  sentEmails.length = 0;
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DISABLE_EMAIL_SENDING", "false");
});

afterEach(() => {
  vi.unstubAllEnvs();
  sentEmails.length = 0;
});

describe("Cloudflare email sending", () => {
  it("sends text and HTML with the Authier sender through the binding", async () => {
    const send = createSender();

    await withEmailSending({ EMAIL: { send } }, () =>
      sendEmail("user@example.com", content),
    );

    expect(send).toHaveBeenCalledExactlyOnceWith({
      from: {
        email: "no-reply@authier.pm",
        name: "Authier password manager",
      },
      to: "user@example.com",
      ...content,
    });
    expect(sentEmails).toHaveLength(0);
  });

  it("supports text-only recovery notifications", async () => {
    const send = createSender();

    await withEmailSending({ EMAIL: { send } }, () =>
      sendEmail("backup@example.com", {
        subject: "Master device reset completed",
        text: "Your master device was reset.",
      }),
    );

    expect(send.mock.calls[0]?.[0]).toMatchObject({
      to: "backup@example.com",
      subject: "Master device reset completed",
      text: "Your master device was reset.",
    });
    expect(send.mock.calls[0]?.[0]).not.toHaveProperty("html");
  });

  it.each([undefined, "", "true", "FALSE"])(
    "captures messages without delivery when DISABLE_EMAIL_SENDING is %s",
    async (value) => {
      const send = createSender();
      vi.stubEnv("DISABLE_EMAIL_SENDING", value);

      await withEmailSending({ EMAIL: { send } }, () =>
        sendEmail("user@example.com", content),
      );

      expect(send).not.toHaveBeenCalled();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]).toMatchObject({
        to: "user@example.com",
        ...content,
      });
    },
  );

  it("never sends in test mode even when delivery is explicitly enabled", async () => {
    const send = createSender();
    vi.stubEnv("NODE_ENV", "test");

    await withEmailSending({ EMAIL: { send } }, () =>
      sendEmail("user@example.com", content),
    );

    expect(send).not.toHaveBeenCalled();
    expect(sentEmails).toHaveLength(1);
  });

  it("fails clearly when enabled without a Cloudflare binding", async () => {
    await expect(
      withEmailSending({}, () => sendEmail("user@example.com", content)),
    ).rejects.toThrow("Cloudflare EMAIL binding is not configured");
    expect(sentEmails).toHaveLength(0);
  });

  it("preserves Cloudflare errors so callers can roll back and retry", async () => {
    const failure = Object.assign(new Error("Daily sending quota reached"), {
      code: "E_DAILY_LIMIT_EXCEEDED",
    });
    const send = createSender().mockRejectedValueOnce(failure);

    await expect(
      withEmailSending({ EMAIL: { send } }, () =>
        sendEmail("user@example.com", content),
      ),
    ).rejects.toBe(failure);

    expect(send).toHaveBeenCalledOnce();
    expect(sentEmails).toHaveLength(0);
  });

  it("keeps overlapping invocation bindings isolated and clears the scope", async () => {
    const first = createSender();
    const second = createSender();
    const gate = Promise.withResolvers<void>();

    const pending = withEmailSending({ EMAIL: { send: first } }, async () => {
      await gate.promise;
      await sendEmail("first@example.com", content);
    });
    await withEmailSending({ EMAIL: { send: second } }, () =>
      sendEmail("second@example.com", content),
    );
    gate.resolve();
    await pending;

    expect(first).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ to: "first@example.com" }),
    );
    expect(second).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ to: "second@example.com" }),
    );
    await expect(sendEmail("outside@example.com", content)).rejects.toThrow(
      "Cloudflare EMAIL binding is not configured",
    );
  });
});
