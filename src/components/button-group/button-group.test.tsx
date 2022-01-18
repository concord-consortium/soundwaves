import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ButtonGroup } from "./button-group";

describe("ButtonGroup", () => {

  it("renders NO buttons when none are configured via props", () => {
    render(<ButtonGroup buttons={[]} selectedButtonLabel={""} />);
    expect(screen.queryByRole("button")).toBeNull();
    });

  it("renders the correct number of buttons; and the corresponding labels", () => {
    const buttonLabels = ["first button label", "second", "3", "4th"];

    render(<ButtonGroup buttons={buttonLabels} selectedButtonLabel={""} />);
    const foundButtons = screen.queryAllByRole("button");

    expect(foundButtons.length).toEqual(buttonLabels.length);

    buttonLabels.forEach((value) => {
      expect(screen.getByText(value, {exact: true})).toBeDefined();
    });
  });

  it("invokes the call-back function, when a (NON-selected) button is clicked", () => {
    const mockCallback = jest.fn();

    render(<ButtonGroup buttons={["a", "b"]} selectedButtonLabel={"a"} onButtonClicked={mockCallback} />);
    fireEvent.click(screen.getByText("b"));
    expect(mockCallback).toHaveBeenCalledWith(1, "b");
  });

});
