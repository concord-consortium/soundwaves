import React from "react";
import { render, screen } from "@testing-library/react";
import { ButtonGroup } from "./button-group";

describe("ButtonGroup", () => {
  it("shows the elements and text", () => {
    render(<ButtonGroup
      />);
    // expect(screen.getByTestId("zoom-in-button")).toBeDefined();
    // expect(screen.getByTestId("zoom-out-button")).toBeDefined();
  });
});
