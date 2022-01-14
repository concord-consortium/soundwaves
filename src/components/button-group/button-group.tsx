import React, {useState} from "react";
import { IButtonGroupProps } from "../../types";

import "./button-group.scss";


export const ButtonGroup = (props: IButtonGroupProps) => {
  const { buttons, onButtonClicked } = props;
  const [clickedId, setClickedId] = useState(-1);

  const handleClick = ( event: React.MouseEvent<HTMLButtonElement, MouseEvent>, i: number) => {
    setClickedId(i);
    onButtonClicked && onButtonClicked(i, buttons[i]);
  };

  return (
    <>
      { buttons.map((buttonLabel, i) => (
        <button
          key={i}
          name={buttonLabel}
          className={
            (i === clickedId) ? "buttonGroupButton active" : "buttonGroupButton"
            }
          onClick={ (event) => { handleClick(event, i); } }
          >
          {buttonLabel}
        </button>
      ))}
    </>
  );
};

// export const ZoomButtons = () => {
//   // const { handleZoomOut, handleZoomIn } = props;

//   return (
//     <div
//       className="zoom-buttons-container"
//     >
//     </div>
//   );
// };
