import React from "react";
import { useClient } from "../context/nillion";

const Status: React.FC = () => {
  const { client } = useClient();

  return (
    <div className="max-w-screen-sm p-12 mx-auto bg-gray-50 rounded-md shadow-lg">
      <>
        <h5 className="text-md">CLIENT {client ? `LOADED ✅` : `NOT LOADED`}</h5>
        {client && <div id="wasm-indicator" wasm-state="loaded" />}
      </>
    </div>
  );
};

export default Status;
