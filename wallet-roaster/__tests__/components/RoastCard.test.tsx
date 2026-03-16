import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RoastCard from "@/components/RoastCard";
import type { RoastResult } from "@/types";

// ShareButtons uses clipboard — mock it
vi.mock("@/components/ShareButtons", () => ({
  default: ({ walletAddress }: { walletAddress: string }) => (
    <div data-testid="share-buttons">{walletAddress}</div>
  ),
}));

const MOCK_RESULT: RoastResult = {
  roast:
    "You ape'd into $BONK at the literal top.\n\nYour 47 tokens are basically a graveyard.\n\nVerdict: \"NGMI. Speedrun.\"",
  stats: {
    tokensHeld: 47,
    biggestBag: "BONK",
    rugCount: 12,
    degenScore: 91,
  },
};

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

describe("RoastCard", () => {
  it("renders the degen score", () => {
    render(<RoastCard result={MOCK_RESULT} walletAddress={WALLET} />);
    expect(screen.getByText("91/100")).toBeInTheDocument();
  });

  it("renders the roast text paragraphs", () => {
    render(<RoastCard result={MOCK_RESULT} walletAddress={WALLET} />);
    expect(screen.getByText(/You ape'd into \$BONK/)).toBeInTheDocument();
    expect(screen.getByText(/47 tokens are basically/)).toBeInTheDocument();
  });

  it("renders the verdict paragraph with special styling", () => {
    render(<RoastCard result={MOCK_RESULT} walletAddress={WALLET} />);
    const verdict = screen.getByText(/Verdict:/);
    expect(verdict).toBeInTheDocument();
    expect(verdict.className).toContain("border-l-2");
  });

  it("displays stats: tokens, rugs, biggest bag", () => {
    render(<RoastCard result={MOCK_RESULT} walletAddress={WALLET} />);
    expect(screen.getByText("47")).toBeInTheDocument(); // tokensHeld
    expect(screen.getByText("12")).toBeInTheDocument(); // rugCount
    expect(screen.getByText("$BONK")).toBeInTheDocument();
  });

  it("shows truncated wallet address", () => {
    render(<RoastCard result={MOCK_RESULT} walletAddress={WALLET} />);
    // slice(0,4) = "7xKX", slice(-4) = "gAsU"
    expect(screen.getByText("7xKX...gAsU")).toBeInTheDocument();
  });

  it("renders ShareButtons component", () => {
    render(<RoastCard result={MOCK_RESULT} walletAddress={WALLET} />);
    expect(screen.getByTestId("share-buttons")).toBeInTheDocument();
  });
});
