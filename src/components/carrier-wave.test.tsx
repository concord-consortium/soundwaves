import React, { ChangeEvent } from "react";
import { render, screen } from "@testing-library/react";
import { CarrierWave } from "./carrier-wave";

const mockCarrierChangeHandler = ((event: ChangeEvent<HTMLSelectElement>): any => {});

describe("CarrierWave", () => {
  it("shows the elements and text", () => {
    render(<CarrierWave
      carrierWaveSelection=""
      wavelength="9999"
      timesHigherThanHuman="50000"
      modulation="FM"
      handleCarrierChange={mockCarrierChangeHandler}
      />);
    expect(screen.getByText("Radio Carrier Wave:")).toBeDefined();
    expect(screen.getByText("Wavelength:")).toBeDefined();
    expect(screen.getByText("Modulation:")).toBeDefined();
  });
});
