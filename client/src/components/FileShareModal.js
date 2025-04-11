import React, { useState, useEffect } from "react";

const FileShareModal = ({ setModalOpen, contract, fileId, fileUrl }) => {
    const [recipientAddress, setRecipientAddress] = useState("");
    const [accessList, setAccessList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch the access list for this specific file
    const fetchFileAccessList = async () => {
        try {
            if (!contract || fileId === undefined) return;
            setLoading(true);
            const list = await contract.getFileAccessList(fileId);
            setAccessList(list || []);
        } catch (error) {
            console.error("Error fetching file access list:", error);
        } finally {
            setLoading(false);
        }
    };

    // Grant access to specific file
    const grantFileAccess = async () => {
        if (!recipientAddress) {
            alert("Please enter an address.");
            return;
        }

        // Check if the address already has access
        const isAlreadyGranted = accessList.some(
            (entry) => entry.user === recipientAddress && entry.access
        );

        if (isAlreadyGranted) {
            alert("This address already has access to this file.");
            return;
        }

        try {
            setLoading(true);
            await contract.allowFile(recipientAddress, fileId);
            setRecipientAddress(""); // Clear input field
            // Wait a bit for the blockchain transaction to process
            setTimeout(() => {
                fetchFileAccessList(); // Refresh the list
            }, 2000);
        } catch (error) {
            console.error("Error granting file access:", error);
            alert("Transaction failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Revoke access from an address
    const revokeFileAccess = async (userAddress) => {
        try {
            setLoading(true);
            await contract.disallowFile(userAddress, fileId);

            // Wait a bit for the blockchain transaction to process
            setTimeout(() => {
                fetchFileAccessList(); // Refresh the list
            }, 2000);
        } catch (error) {
            console.error("Error revoking file access:", error);
            alert("Failed to revoke access. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Load access list when component mounts
    useEffect(() => {
        if (contract && fileId !== undefined) {
            fetchFileAccessList();
        }
    }, [contract, fileId]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[30%] max-w-lg">
                <h2 className="text-lg font-bold mb-4 text-center text-white">Share File</h2>

                {/* File Preview */}
                <div className="mb-4 p-2 bg-gray-700 rounded-lg">
                    <p className="text-white text-sm mb-2">File ID: {fileId}</p>
                    {fileUrl && fileUrl.includes(".jpg") || fileUrl.includes(".png") || fileUrl.includes(".gif") ? (
                        <img
                            src={fileUrl}
                            alt="File preview"
                            className="max-h-32 mx-auto rounded"
                        />
                    ) : (
                        <div className="text-center text-white py-2">
                            {fileUrl ? fileUrl.substring(fileUrl.lastIndexOf('/') + 1) : "File"}
                        </div>
                    )}
                </div>

                {/* Grant Access Input */}
                <input
                    type="text"
                    placeholder="Enter address to grant access"
                    className="w-full text-gray-900 border border-gray-400 p-2 rounded-md mb-4"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                />
                <button
                    onClick={grantFileAccess}
                    className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Grant Access"}
                </button>

                {/* List of Addresses with Access to this File */}
                <h3 className="text-white mt-4 text-sm font-semibold">File Access List:</h3>
                {loading ? (
                    <p className="text-gray-400 text-sm mt-2">Loading...</p>
                ) : accessList.length > 0 ? (
                    <ul className="mt-2 bg-gray-700 p-2 rounded-md max-h-40 overflow-y-auto">
                        {accessList.map((access, index) => (
                            <li
                                key={index}
                                className={`flex justify-between items-center text-sm border-b border-gray-600 py-1 ${access.access ? "text-green-400" : "text-red-400"
                                    }`}
                            >
                                <span className="truncate w-3/4">{access.user}</span>
                                <span className="text-xs">
                                    {access.access ? "Has Access" : "Access Revoked"}
                                </span>
                                {access.access && (
                                    <button
                                        onClick={() => revokeFileAccess(access.user)}
                                        className="text-red-400 hover:text-red-100 border border-red-400 rounded px-2 py-1"
                                        disabled={loading}
                                    >
                                        Revoke
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400 text-sm mt-2">No access granted yet.</p>
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

export default FileShareModal;