import React from "react";

import "./application-header.scss";

import WavesLogo from "../../assets/WavesLogo_30pxh.png";

export const AppHeader = () => {
  return (
    <div className="application-header-container">
      <img src={WavesLogo} alt="Waves Logo" />
      &nbsp;&nbsp;Sound Visualizer
    </div>
  );
};
