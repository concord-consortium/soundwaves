import React from "react";

import PlusIcon from "../../assets/icons/add_black_48dp.svg";
import MinusIcon from "../../assets/icons/remove_black_48dp.svg";
import { IZoomButtonsProps } from "../../types";

import "./zoom-buttons.scss";


export const ZoomButtons = (props: IZoomButtonsProps) => {
    const { handleZoomOut, handleZoomIn } = props;

    return (
        <div
            className="zoom-buttons-container"
            >
            <div
                className="zoom-button"
                onClick={handleZoomOut}
                >
                -<MinusIcon />
            </div>
            <div
                className="zoom-button"
                onClick={handleZoomIn}
                >
                +<PlusIcon />
            </div>
        </div>
    );
};
