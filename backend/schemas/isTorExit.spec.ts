import { lookup } from "dns/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isTorExit } from "./isTorExit";

vi.mock("dns/promises", () => ({ lookup: vi.fn() }));

const lookupMock = vi.mocked(lookup);

describe("isTorExit", () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it("returns true when the Tor DNS exit list matches the address", async () => {
    lookupMock.mockResolvedValue({ address: "127.0.0.2", family: 4 });

    await expect(isTorExit("2.58.56.220")).resolves.toBe(true);
    expect(lookupMock).toHaveBeenCalledWith("220.56.58.2.dnsel.torproject.org");
  });
});
