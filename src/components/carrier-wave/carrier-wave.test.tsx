import React from "react";
import { render, screen } from "@testing-library/react";
import { CarrierWave } from "./carrier-wave";

describe("CarrierWave", () => {
  it("shows the elements and text", () => {
    render(<CarrierWave
        audioBuffer={undefined}
        playbackRate={1}
        playbackProgress={0}
        graphWidth={200}
        graphHeight={100}
        volume={1}
        interactive={false}
      />);
    expect(screen.getByText("Modulation")).toBeDefined();
    expect(screen.getByText("Carrier Frequency")).toBeDefined();
    expect(screen.getByText("kHz")).toBeDefined();
  });
});
