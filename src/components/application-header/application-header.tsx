import React from "react";

import "./application-header.scss";

import WavesLogo from "../../assets/wavesLogo.png";

export const AppHeader = () => {
    return (
      <div className="application-header-container">
        <img src={WavesLogo} alt="Waves Logo" />
        &nbsp;&nbsp;Sounds are waves
      </div>
    );
};