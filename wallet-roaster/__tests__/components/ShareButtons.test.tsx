import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ShareButtons from "@/components/ShareButtons";

const ROAST =
  "You ape'd into $BONK at the literal top. Congratulations.\n\nVerdict: \"NGMI.\"";
const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

describe("ShareButtons", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders Share on X and Copy Roast buttons", () => {
    render(<ShareButtons roast={ROAST} walletAddress={WALLET} />);
    expect(screen.getByText("Share on X")).toBeInTheDocument();
    expect(screen.getByText("Copy Roast")).toBeInTheDocument();
  });

  it("Share on X link points to twitter intent URL", () => {
    render(<ShareButtons roast={ROAST} walletAddress={WALLET} />);
    const link = screen.getByText("Share on X").closest("a");
    expect(link?.href).toContain("twitter.com/intent/tweet");
  });

  it("copies roast to clipboard when Copy Roast is clicked", async () => {
    render(<ShareButtons roast={ROAST} walletAddress={WALLET} />);
    const btn = screen.getByText("Copy Roast");
    fireEvent.click(btn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(ROAST);
  });

  it("shows Copied! feedback after click, then reverts", async () => {
    vi.useFakeTimers();
    render(<ShareButtons roast={ROAST} walletAddress={WALLET} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Copy Roast"));
    });

    expect(screen.getByText("Copied!")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2001);
    });

    expect(screen.getByText("Copy Roast")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
