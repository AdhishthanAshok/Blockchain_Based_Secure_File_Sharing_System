import { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FileShareModal from "./FileShareModal";

const Display = ({ contract, account }) => {
  const [data, setData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);

  // Helper function to get proper display URL
  const getDisplayUrl = (url) => {
    if (!url) return "";

    // Handle IPFS URLs
    if (url.startsWith("ipfs://")) {
      return `https://gateway.pinata.cloud/ipfs/${url.substring(7)}`;
    }

    // Handle cases when URL might already be a gateway URL
    if (url.includes("/ipfs/")) {
      return url;
    }

    // Handle Pinata URLs
    if (url.includes("pinata") && !url.includes("gateway.pinata")) {
      // Convert direct Pinata URL to gateway URL if needed
      const cidMatch = url.match(/\/([a-zA-Z0-9]{46})/);
      if (cidMatch && cidMatch[1]) {
        return `https://gateway.pinata.cloud/ipfs/${cidMatch[1]}`;
      }
    }

    return url;
  };

  const getdata = async () => {
    setLoading(true);
    setData([]);
    let dataArray;
    const otherAddress = document.querySelector(".address").value;

    try {
      console.log("Fetching files for address:", otherAddress || "self");

      if (otherAddress) {
        // First try the display function (global access)
        try {
          console.log("Trying global access with display()...");
          dataArray = await contract.display(otherAddress);
          console.log("Global access successful:", dataArray);
        } catch (e) {
          console.log("Global access failed:", e.message);

          // If global access fails, try file-specific access
          try {
            console.log("Trying file-specific access with displaySharedFiles()...");
            // Check if the displaySharedFiles function exists in the contract
            if (contract.functions.displaySharedFiles) {
              dataArray = await contract.displaySharedFiles(otherAddress);
              console.log("File-specific access successful:", dataArray);
            } else {
              console.log("displaySharedFiles function not found in contract");
              throw new Error("You don't have access to these files");
            }
          } catch (specificError) {
            console.log("File-specific access failed:", specificError.message);
            throw new Error("You don't have access to these files");
          }
        }
      } else {
        // Get user's own files
        try {
          if (contract.functions.getAllFiles) {
            dataArray = await contract.getAllFiles();
          } else {
            dataArray = await contract.display(account);
          }
          console.log("Got own files:", dataArray);
        } catch (e) {
          console.log("Error getting own files:", e.message);
          throw e;
        }
      }
    } catch (e) {
      console.error("Error fetching files:", e);
      toast.error("You don't have access to these files or there was an error processing your request");
      setLoading(false);
      return;
    }

    const isEmpty = !dataArray || dataArray.length === 0;
    console.log("Data array:", dataArray);

    if (!isEmpty) {
      // Process the files for display
      const fileElements = dataArray.map((item, i) => {
        // Check if item is a File struct (with url property) or just a string
        let fileUrl;
        let fileId;

        if (typeof item === 'object' && item !== null) {
          // For new contract structure with File objects
          if (item.url !== undefined) {
            fileUrl = item.url;
            fileId = item.id !== undefined ? parseInt(item.id.toString()) : i;
          } else {
            // Handle BigNumber conversion if needed
            fileUrl = item.toString();
            fileId = i;
          }
        } else {
          // For original contract structure with string arrays
          fileUrl = item;
          fileId = i;
        }

        console.log(`File ${i}:`, { raw: item, fileUrl, fileId });

        // Get proper display URL
        const displayUrl = getDisplayUrl(fileUrl);
        console.log(`Display URL for file ${i}:`, displayUrl);

        // Check if it's an image
        const isImage = displayUrl.toLowerCase().endsWith('.jpg') ||
          displayUrl.toLowerCase().endsWith('.jpeg') ||
          displayUrl.toLowerCase().endsWith('.png') ||
          displayUrl.toLowerCase().endsWith('.gif') ||
          displayUrl.toLowerCase().includes('image');

        // Get file name from URL
        const fileName = displayUrl.substring(displayUrl.lastIndexOf('/') + 1);

        // Delete file function
        const handleDelete = async (e) => {
          e.stopPropagation();
          e.preventDefault();

          if (window.confirm(`Are you sure you want to delete this file? This will remove access for everyone.`)) {
            try {
              setDeletingFileId(fileId);

              // Check if we have the appropriate delete function in the contract
              if (contract.functions.deleteFile) {
                console.log(`Deleting file with ID: ${fileId}`);
                const tx = await contract.deleteFile(fileId);
                await tx.wait();
                console.log("Delete transaction confirmed:", tx.hash);

                // Remove the file from the displayed list
                setData(prevData => prevData.filter((_, index) => index !== i));

                toast.success("File deleted successfully!");
              } else {
                console.error("Delete function not found in contract");
                toast.error("Delete function not available in this contract");
              }
            } catch (error) {
              console.error("Error deleting file:", error);
              toast.error(`Failed to delete file: ${error.message}`);
            } finally {
              setDeletingFileId(null);
            }
          }
        };

        return (
          <div key={i} className="p-2 relative group">
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
            >
              <div className="bg-white border border-black p-4 rounded-lg">
                <div className="relative h-48 flex items-center justify-center">
                  <img
                    src={displayUrl}
                    alt={fileName}
                    className="rounded-lg object-contain max-h-full max-w-full"
                    onError={(e) => {
                      console.log("Image failed to load:", displayUrl);
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML += `<div class="text-center text-gray-700 py-2">Open File</div>`;
                    }}
                  />
                </div>
              </div>
            </a>

            {/* Control buttons - only show for user's own files (when no address entered) */}
            {!otherAddress && (
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {/* Share button */}
                {contract.functions.allowFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedFile({
                        id: fileId,
                        url: displayUrl
                      });
                      setShowShareModal(true);
                    }}
                    className="bg-blue-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Share this file"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                )}

                {/* Delete button */}
                <button
                  onClick={handleDelete}
                  disabled={deletingFileId === fileId}
                  className={`bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${deletingFileId === fileId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Delete this file"
                >
                  {deletingFileId === fileId ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      });

      setData(fileElements);
    } else {
      toast.info("No files to display");
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Enter Address or Just Click to Get your Data"
          className="text-gray-900 w-full max-w-md h-10 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 address"
        />
      </div>
      <div className="flex justify-center mb-6">
        <button
          onClick={getdata}
          className={`bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Files"}
        </button>
      </div>

      {/* Display files in a grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-center">
        {data}
      </div>

      {/* File Share Modal */}
      {showShareModal && selectedFile && (
        <FileShareModal
          setModalOpen={setShowShareModal}
          contract={contract}
          fileId={selectedFile.id}
          fileUrl={selectedFile.url}
        />
      )}
      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Display;