import React, { ChangeEvent } from "react";
import { render, screen } from "@testing-library/react";
import { CarrierWave } from "./carrier-wave";

const mockCarrierChangeHandler = ((event: ChangeEvent<HTMLSelectElement>): any => {
  if (!event) { console.log("Expected a ChangeEvent"); }
});


describe("CarrierWave", () => {
  it("shows the elements and text", () => {
    render(<CarrierWave
        audioBuffer={undefined}
        playbackProgress={0}
      />);
    expect(screen.getByText("Radio Carrier Wave:")).toBeDefined();
  });
});
