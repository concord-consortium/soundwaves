import React from "react";
import { render, screen } from "@testing-library/react";
import { SoundName } from "../../types";
import { SoundPicker, isPureTone, pureToneFrequencyFromSoundName } from "./sound-picker";

describe("SoundPicker", () => {
  it("shows the elements and text", () => {
    render(<SoundPicker
      selectedSound={"pick-sound" as SoundName}
      setSelectedSound={() => { /* NO-OP */ }}
      recordingAudioBuffer={undefined}
      setRecordingAudioBuffer={() => { /* NO-OP */ }}
      playing={false}
      onMyRecordingChosen={() => { /* NO-OP */ }}
      />);
    expect(screen.getByText("Record")).toBeDefined();
    expect(screen.getByText("OR")).toBeDefined();
    expect(screen.getByText("Pick Sound")).toBeDefined();
  });

  it("tests for pure tones", () => {
    expect(isPureTone("imaginary")).toBeFalsy();
    expect(isPureTone("middle-c")).toBeTruthy();
    expect(isPureTone("c2")).toBeTruthy();
  });

  it("decodes pure tone frequency numbers", () => {
    expect(pureToneFrequencyFromSoundName("")).toEqual(0);
    expect(pureToneFrequencyFromSoundName("middle-c")).toEqual(261.65);
    expect(pureToneFrequencyFromSoundName("c2")).toEqual(65.41);
  });
});
