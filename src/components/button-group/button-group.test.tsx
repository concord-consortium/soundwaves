import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ButtonGroup } from "./button-group";

describe("ButtonGroup", () => {

  it("renders NO buttons when none are configured via props", () => {
    render(<ButtonGroup buttons={[]} selectedButtonLabel={""} />);
    expect(screen.queryByRole("button")).toBeNull();
    });

  it("renders the correct number of buttons; and the corresponding labels", () => {
    const buttonLabels = ["first button label", "second"];
    const labelsLength = buttonLabels.length;

    render(<ButtonGroup buttons={buttonLabels} selectedButtonLabel={""} />);
    const foundButtons = screen.queryAllByRole('button');
    const foundButtonLabels =
      foundButtons.map( (button) => { return button.innerText; });
    const foundLength = foundButtonLabels.length;

    expect(foundLength === labelsLength);
    expect(foundButtonLabels[0] === buttonLabels[0]);
    expect(foundButtonLabels[foundLength - 1] === buttonLabels[labelsLength - 1]);
  });

  it("invokes the call-back function, when a (NON-selected) button is clicked", () => {
    const mockCallback = jest.fn();

    render(<ButtonGroup buttons={["a", "b"]} selectedButtonLabel={"a"} onButtonClicked={mockCallback} />);
    fireEvent.click(screen.getByText("b"));
    expect(mockCallback).toHaveBeenCalledWith(1, "b");
  });

  it("it has no selected item, by default", () => {
    const mockCallback = jest.fn();

    render(<ButtonGroup buttons={["a", "b"]} selectedButtonLabel={"NONE SUCH"} />);
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("b"));
    expect(mockCallback).not.toHaveBeenCalled();
  });

});
