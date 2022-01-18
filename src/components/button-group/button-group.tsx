import React from "react";
import { IButtonGroupProps } from "../../types";

import "./button-group.scss";


export const ButtonGroup = (props: IButtonGroupProps) => {
  const { buttons, selectedButtonLabel, disabled, onButtonClicked } = props;

  const handleClick = (i: number) => {
    if (onButtonClicked) {
      onButtonClicked(i, buttons[i]);
    }
  };

  const cssClasses = (buttonLabel: string, isDisabled = false) => {
    let classes = "buttonGroupButton";

    if (buttonLabel === selectedButtonLabel) { classes += " active"; }
    if (isDisabled) { classes += " disabled"; }

    return classes;
  };

  return (
    <>
      { buttons.map((buttonLabel, i) => (
        <button
          key={i}
          name={buttonLabel}
          disabled={disabled}
          className={cssClasses(buttonLabel, disabled)}
          onClick={ (event) => { handleClick(i); } }
          >
          {buttonLabel}
        </button>
      ))}
    </>
  );
};
