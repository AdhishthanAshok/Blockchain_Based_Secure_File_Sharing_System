import { useState } from "react";
import axios from "axios";

// FileUpload component for uploading files to IPFS via Pinata
const FileUpload = ({ contract, account, provider }) => {
  // State to store the selected file
  const [file, setFile] = useState(null);

  // State to store the name of the selected file
  const [fileName, setFileName] = useState("No File selected");

  // State to manage the loading state during file upload
  const [loading, setLoading] = useState(false);

  // Function to handle form submission and file upload
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    if (file) {
      setLoading(true); // Set loading state to true
      try {
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append("file", file);

        // Make a POST request to Pinata's API to upload the file
        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: "82c2a5e4d14cdc987b69", // Pinata API key
            pinata_secret_api_key: "75eb17725d663ca1b5aabe5dc763c09633063be3d6af5a485eeb615a352dc0ad", // Pinata secret API key
            "Content-Type": "multipart/form-data", // Content type for file upload
          },
        });

        // Construct the IPFS URL for the uploaded file
        const ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;

        // Call the smart contract's `add` function to store the file hash
        contract.add(account, ImgHash);

        console.log(ImgHash); // Log the IPFS URL

        alert("File uploaded successfully!"); // Notify the user of success
        setFileName("No File selected"); // Reset file name
        setFile(null); // Reset file state
      } catch (e) {
        alert("Unable to upload File to Pinata"); // Notify the user of failure
      } finally {
        setLoading(false); // Reset loading state
      }
    }
  };

  // Function to handle file selection
  const retrieveFile = (e) => {
    const selectedFile = e.target.files[0]; // Get the selected file
    if (selectedFile) {
      setFile(selectedFile); // Update the file state
      setFileName(selectedFile.name); // Update the file name state
    }
  };

  return (
    <div className="flex justify-center items-center mt-12">
      {/* Form for file upload */}
      <form
        className="flex flex-col items-center space-y-6 bg-gray-800 text-white p-6 rounded-xl shadow-2xl w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        {/* Title */}
        <h2 className="text-2xl font-bold tracking-wide text-gray-100">
          Upload Your File
        </h2>

        {/* Button to choose a file */}
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg shadow-md hover:scale-105 transition-all duration-300"
        >
          Choose File
        </label>

        {/* Hidden input for file selection */}
        <input
          disabled={!account} // Disable input if no account is connected
          type="file"
          id="file-upload"
          name="data"
          onChange={retrieveFile} // Handle file selection
          className="hidden"
        />

        {/* Display the name of the selected file */}
        <span className="text-gray-300 font-medium">{fileName}</span>

        {/* Button to upload the file */}
        <button
          type="submit"
          className={`${!file
            ? "bg-gray-500 cursor-not-allowed" // Disabled button styling
            : "bg-green-600 hover:bg-green-500 hover:scale-105" // Enabled button styling
            } text-white font-semibold px-6 py-2 rounded-lg flex items-center justify-center shadow-md transition-all duration-300`}
          disabled={!file || loading} // Disable button if no file is selected or loading
        >
          {loading ? (
            <>
              {/* Spinner icon during loading */}
              <svg
                className="animate-spin h-5 w-5 mr-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v8m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              Uploading...
            </>
          ) : (
            "Upload File" // Button text when not loading
          )}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
