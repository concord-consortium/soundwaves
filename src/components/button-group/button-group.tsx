import React, {useState} from "react";
import { IButtonGroupProps } from "../../types";

import "./button-group.scss";


export const ButtonGroup = (props: IButtonGroupProps) => {
  const { buttons, selectedButtonLabel, onButtonClicked } = props;

  const handleClick = ( event: React.MouseEvent<HTMLButtonElement, MouseEvent>, i: number) => {
    onButtonClicked && onButtonClicked(i, buttons[i]);
  };

  return (
    <>
      { buttons.map((buttonLabel, i) => (
        <button
          key={i}
          name={buttonLabel}
          className={
            (buttonLabel === selectedButtonLabel) ? "buttonGroupButton active" : "buttonGroupButton"
            }
            onClick={ (event) => { handleClick(event, i); } }
          >
          {buttonLabel}
        </button>
      ))}
    </>
  );
};
