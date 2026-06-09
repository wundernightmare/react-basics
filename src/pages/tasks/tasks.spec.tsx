import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@app/testing/render";

import { TasksPage } from ".";

describe("TasksPage", () => {
  it("renders the seeded tasks", async () => {
    renderWithProviders(<TasksPage />);
    expect(await screen.findByText("Прочитать README")).toBeInTheDocument();
    expect(screen.getByText("Запустить pnpm dev")).toBeInTheDocument();
  });

  it("creates a task through the form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TasksPage />);
    await screen.findByText("Прочитать README");

    await user.type(screen.getByLabelText("Название задачи"), "Купить кофе");
    await user.click(screen.getByRole("button", { name: "Добавить" }));

    expect(await screen.findByText("Купить кофе")).toBeInTheDocument();
  });

  it("shows a validation error for a blank title and does not submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TasksPage />);
    await screen.findByText("Прочитать README");

    await user.click(screen.getByRole("button", { name: "Добавить" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Введите название");
  });

  it("toggles a task to done", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TasksPage />);

    const todo = await screen.findByText("Написать первый тест");
    const row = todo.closest("li")!;
    await user.click(within(row).getByRole("button", { name: "complete" }));

    await waitFor(() => {
      expect(within(row).getByText("Готово", { selector: "span" })).toBeInTheDocument();
    });
  });

  it("deletes a task", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TasksPage />);

    const target = await screen.findByText("Запустить pnpm dev");
    const row = target.closest("li")!;
    await user.click(within(row).getByRole("button", { name: "delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Запустить pnpm dev")).not.toBeInTheDocument();
    });
  });
});
