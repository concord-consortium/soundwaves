import React from "react";
import { render, screen } from "@testing-library/react";
import { App } from "./app";

describe("App", () => {
  it("shows the header", () => {
    render(<App />);
    expect(screen.getByText("Sound Visualizer")).toBeDefined();
  });
});
