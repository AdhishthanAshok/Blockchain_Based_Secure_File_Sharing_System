import React from "react";
import { useEffect } from "react";

const Modal = ({ setModalOpen, contract }) => {
  const sharing = async () => {
    const address = document.querySelector(".address").value;
    await contract.allow(address);
    setModalOpen(false);
  };
  useEffect(() => {
    const accessList = async () => {
      const addressList = await contract.shareAccess();
      let select = document.querySelector("#selectNumber");
      const options = addressList;

      for (let i = 0; i < options.length; i++) {
        let opt = options[i];
        let e1 = document.createElement("option");
        e1.textContent = opt;
        e1.value = opt;
        select.appendChild(e1);
      }
    };
    contract && accessList();
  }, [contract]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-[50%] md:w-[40%] lg:w-[30%]">
        <h2 className="text-lg font-bold mb-4 text-center text-white">Share Files</h2>
        <input
          type="text"
          placeholder="Enter recipient's address"
          className="address w-full min-w-[5ch] text-gray-900 border border-gray-400 p-2 rounded-md"
        />
        <div className="flex justify-between mt-4 space-x-2">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-red-600 text-white rounded-lg">
            Cancel
          </button>
          <button onClick={() => sharing()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Share
          </button>
        </div>
      </div>
    </div>

  );
};

export default Modal;
