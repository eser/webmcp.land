import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CopyButton } from "@/components/resources/copy-button";

// Mock dependencies - use inline functions since vi.mock is hoisted
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.copied": "Copied!",
        "common.failedToCopy": "Failed to copy",
      };
      return translations[key] || key;
    },
    i18n: { language: "en" },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/analytics", () => ({
  analyticsResource: {
    copy: vi.fn(),
  },
}));

// Import mocked modules after vi.mock calls
import { toast } from "sonner";
import { analyticsResource } from "@/lib/analytics";

describe("CopyButton", () => {
  const mockClipboard = {
    writeText: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: mockClipboard,
    });
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  it("should render copy button", () => {
    render(<CopyButton content="test content" />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should copy content to clipboard when clicked", async () => {
    const content = "Hello, World!";
    render(<CopyButton content={content} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith(content);
  });

  it("should show success toast on successful copy", async () => {
    render(<CopyButton content="test" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(toast.success).toHaveBeenCalledWith("Copied!");
  });

  it("should track analytics with resourceId when provided", async () => {
    render(<CopyButton content="test" resourceId="resource-123" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(analyticsResource.copy).toHaveBeenCalledWith("resource-123");
  });

  it("should track analytics with undefined when resourceId not provided", async () => {
    render(<CopyButton content="test" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(analyticsResource.copy).toHaveBeenCalledWith(undefined);
  });

  it("should show Check icon after successful copy", async () => {
    render(<CopyButton content="test" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // After copy, the Check icon should be rendered with green color
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg).toHaveClass("text-green-500");
  });

  it("should show error toast when clipboard fails", async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error("Clipboard error"));

    render(<CopyButton content="test" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to copy");
  });

  it("should not show Check icon when clipboard fails", async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error("Clipboard error"));

    render(<CopyButton content="test" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Should not have the green check icon
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg).not.toHaveClass("text-green-500");
  });

  it("should handle empty content", async () => {
    render(<CopyButton content="" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith("");
  });

  it("should handle content with special characters", async () => {
    const specialContent = '<script>alert("xss")</script>';
    render(<CopyButton content={specialContent} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith(specialContent);
  });

  it("should handle multiline content", async () => {
    const multilineContent = "Line 1\nLine 2\nLine 3";
    render(<CopyButton content={multilineContent} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith(multilineContent);
  });

  it("should be clickable multiple times", async () => {
    render(<CopyButton content="test" />);

    // First click
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);

    // Second click
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(mockClipboard.writeText).toHaveBeenCalledTimes(2);
  });
});
