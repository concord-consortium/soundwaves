import React from "react";
import { render, screen } from "@testing-library/react";
import { AppHeader } from "./application-header";

describe("AppHeader", () => {
  it("shows the elements and text", () => {
    render(<AppHeader
      />);
    expect(screen.getByText("Sound Visualizer")).toBeDefined();
    expect(screen.getByAltText("Waves Logo")).toBeDefined();
  });
});
