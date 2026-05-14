import { describe, expect, it, jest } from "@jest/globals";

jest.mock("uuid", () => ({
  v4: () => "test-uuid",
}));

import { deleteFileIfExists, isManagedFileUri } from "../files";

describe("managed file helpers", () => {
  it("recognizes managed file URIs inside a supplied safe root", () => {
    expect(
      isManagedFileUri(
        "file:///data/user/0/app/files/butterfly-collection/photos/sample.jpg",
        "file:///data/user/0/app/files/butterfly-collection/",
      ),
    ).toBe(true);

    expect(
      isManagedFileUri(
        "file:///storage/emulated/0/Download/sample.jpg",
        "file:///data/user/0/app/files/butterfly-collection/",
      ),
    ).toBe(false);
  });

  it("refuses to delete files outside the configured safe root", async () => {
    await expect(
      deleteFileIfExists("file:///storage/emulated/0/Download/sample.jpg", {
        safeRootUri: "file:///data/user/0/app/files/butterfly-collection/",
      }),
    ).rejects.toThrow("outside the app sandbox");
  });
});
