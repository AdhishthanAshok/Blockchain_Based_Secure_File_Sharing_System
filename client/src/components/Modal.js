import React, { useState, useEffect } from "react";

const Modal = ({ setModalOpen, contract }) => {
  const [recipientAddress, setRecipientAddress] = useState(""); // Input state for address
  const [accessHistory, setAccessHistory] = useState([]); // List of all addresses with history

  // Fetch the full history of granted and revoked addresses
  const fetchAccessHistory = async () => {
    try {
      if (!contract) return;
      const addressList = await contract.shareAccess(); // Calls shareAccess() from Upload.sol
      setAccessHistory(addressList || []); // Store in state
    } catch (error) {
      console.error("Error fetching access history:", error);
    }
  };

  // Grant Access to an Address
  const grantAccess = async () => {
    if (!recipientAddress) {
      alert("Please enter an address.");
      return;
    }

    // Check if the address is already granted
    const isAlreadyGranted = accessHistory.some(
      (entry) => entry.user === recipientAddress && entry.access
    );

    if (isAlreadyGranted) {
      alert("Already have access.");
      return;
    }

    try {
      await contract.allow(recipientAddress); // Calls allow() from Upload.sol
      setRecipientAddress(""); // Clear input field
      fetchAccessHistory(); // Refresh the list
    } catch (error) {
      console.error("Error granting access:", error);
      alert("Transaction failed. Please try again.");
    }
  };

  // Revoke Access from an Address
  const revokeAccess = async (userAddress) => {
    try {
      await contract.disallow(userAddress); // Calls disallow() from Upload.sol

      // Update the existing log to "Revoked" instead of removing it
      setAccessHistory((prevHistory) =>
        prevHistory.map((entry) =>
          entry.user === userAddress ? { ...entry, access: false } : entry
        )
      );
    } catch (error) {
      console.error("Error revoking access:", error);
      alert("Failed to revoke access. Please try again.");
    }
  };

  // Load access history when contract is available
  useEffect(() => {
    if (contract) {
      fetchAccessHistory();
    }
  }, [contract]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[30%] max-w-lg">
        <h2 className="text-lg font-bold mb-4 text-center text-white">Manage Access</h2>

        {/* Grant Access Input */}
        <input
          type="text"
          placeholder="Enter address to grant access"
          className="w-full text-gray-900 border border-gray-400 p-2 rounded-md mb-4"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
        />
        <button
          onClick={grantAccess}
          className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Grant Access
        </button>

        {/* List of Addresses with Grant/Revoke History */}
        <h3 className="text-white mt-4 text-sm font-semibold">Access History:</h3>
        {accessHistory.length > 0 ? (
          <ul className="mt-2 bg-gray-700 p-2 rounded-md max-h-40 overflow-y-auto">
            {accessHistory.map((access, index) => (
              <li
                key={index}
                className={`flex justify-between items-center text-sm border-b border-gray-600 py-1 ${access.access ? "text-green-400" : "text-red-400"
                  }`}
              >
                <span className="truncate w-3/4">{access.user}</span>
                <span className="text-xs">
                  {access.access ? "Access Granted" : "Revoked"}
                </span>
                {access.access && (
                  <button
                    onClick={() => revokeAccess(access.user)}
                    className="text-red-400 hover:text-red-100 border border-red-400 rounded px-2 py-1"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm mt-2">No access history found.</p>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
