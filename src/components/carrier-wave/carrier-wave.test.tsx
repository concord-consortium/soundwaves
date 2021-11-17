import React from "react";
import { render, screen } from "@testing-library/react";
import { CarrierWave } from "./carrier-wave";

describe("CarrierWave", () => {
  it("shows the elements and text", () => {
    render(<CarrierWave
        audioBuffer={undefined}
        playbackProgress={0}
        graphWidth={200}
        volume={1}
        interactive={false}
        shouldDrawWaveCaptions={false}
      />);
    expect(screen.getByText("Radio Carrier Wave:")).toBeDefined();
  });
});
