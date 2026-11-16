import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { notifyDataChanged, useOnDataChanged } from "./dataChanged";

describe("dataChanged", () => {
  it("reloads when data changed", () => {
    const reload = vi.fn();
    renderHook(() => useOnDataChanged(reload));

    notifyDataChanged();

    expect(reload).toHaveBeenCalledOnce();
  });

  it("calls the latest reload function", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useOnDataChanged(fn), {
      initialProps: { fn: first },
    });
    rerender({ fn: second });

    notifyDataChanged();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("stops listening once unmounted", () => {
    const reload = vi.fn();
    const { unmount } = renderHook(() => useOnDataChanged(reload));
    unmount();

    notifyDataChanged();

    expect(reload).not.toHaveBeenCalled();
  });
});
