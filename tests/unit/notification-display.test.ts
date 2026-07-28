import { describe, expect, it } from "vitest";
import { safeNotificationPath } from "@/features/notifications/utils/notification-display";

describe("notification display safety", () => {
  it("accepts only internal absolute paths", () => {
    expect(safeNotificationPath("/championships/id")).toBe("/championships/id");
    expect(safeNotificationPath("https://evil.example")).toBeNull();
    expect(safeNotificationPath("//evil.example")).toBeNull();
    expect(safeNotificationPath(null)).toBeNull();
  });
});
