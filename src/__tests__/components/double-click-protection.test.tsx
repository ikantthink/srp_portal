import { describe, it, expect, vi } from "vitest";
import { useState, useTransition } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Self-check for the two double-click protection mechanisms rolled out across
 * the app: SubmitButton (useFormStatus, for `<form action={fn}>`) and the
 * useTransition pattern (for plain onClick mutations). Both should collapse
 * two rapid clicks into a single call to the underlying action.
 */

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("SubmitButton double-click protection", () => {
  it("only invokes the form action once when clicked twice rapidly", async () => {
    const action = vi.fn(async () => {
      await delay(20);
    });

    render(
      <form action={action}>
        <SubmitButton>Submit</SubmitButton>
      </form>
    );

    const button = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });
});

function TransitionGuardedButton({ onAction }: { onAction: () => Promise<void> }) {
  const [count, setCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await onAction();
      setCount((c) => c + 1);
    });
  }

  return (
    <button onClick={handleClick} disabled={isPending}>
      Clicked {count} times
    </button>
  );
}

describe("useTransition double-click protection", () => {
  it("only invokes the action once when clicked twice rapidly", async () => {
    const action = vi.fn(async () => {
      await delay(20);
    });

    render(<TransitionGuardedButton onAction={action} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(screen.getByText("Clicked 1 times")).toBeInTheDocument());
    expect(action).toHaveBeenCalledTimes(1);
  });
});
