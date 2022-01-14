import React from "react";
import { render, screen } from "@testing-library/react";
import { ZoomButtons } from "./zoom-buttons";

describe("ZoomButtons", () => {
  it("shows the elements and text", () => {
    render(<ZoomButtons
      />);
    expect(screen.getByTestId("zoom-in-button")).toBeDefined();
    expect(screen.getByTestId("zoom-out-button")).toBeDefined();
  });
});
