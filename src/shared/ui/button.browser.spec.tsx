import { useState } from "react";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";

import { Button } from "./button";

// Example browser-mode test: rendered in a real Chromium via Playwright, so the
// assertions exercise actual DOM, layout and event dispatch (not jsdom's
// approximation). Run with `pnpm test:browser`. Uses `vitest-browser-react`'s
// `render` + retry-able locators and `expect.element`.

function Counter() {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>Count is {count}</Button>;
}

test("button renders visibly and reacts to a real click", async () => {
  const screen = await render(<Counter />);

  const button = screen.getByRole("button", { name: "Count is 0" });
  await expect.element(button).toBeVisible();

  await button.click();

  await expect.element(screen.getByRole("button", { name: "Count is 1" })).toBeVisible();
});
