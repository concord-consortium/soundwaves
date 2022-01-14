import React, {useState} from "react";
import { IButtonGroupProps } from "../../types";

import "./button-group.scss";


export const ButtonGroup = (props: IButtonGroupProps) => {
  const { buttons, selectedButtonLabel, onButtonClicked } = props;
  const selectionId = buttons.indexOf(selectedButtonLabel);
  const [selectedButtonId, setSelectedButtonId] = useState(selectionId);

  const handleClick = ( event: React.MouseEvent<HTMLButtonElement, MouseEvent>, i: number) => {
    // If user clicks on the already selected button, it's a no-op
    if (i === selectedButtonId) { return; }

    setSelectedButtonId(i);
    onButtonClicked && onButtonClicked(i, buttons[i]);
  };

  return (
    <>
      { buttons.map((buttonLabel, i) => (
        <button
          key={i}
          name={buttonLabel}
          className={
            (i === selectedButtonId) ? "buttonGroupButton active" : "buttonGroupButton"
            }
          onClick={ (event) => { handleClick(event, i); } }
          >
          {buttonLabel}
        </button>
      ))}
    </>
  );
};
