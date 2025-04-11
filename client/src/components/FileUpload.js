import { useState } from "react";
import axios from "axios";

const FileUpload = ({ contract, account, provider }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No File selected");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: "",
            pinata_secret_api_key: "",
            "Content-Type": "multipart/form-data",
          },
        });
        const ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
        contract.add(account, ImgHash);
        console.log(ImgHash);

        alert("File uploaded successfully!");
        setFileName("No File selected");
        setFile(null);
      } catch (e) {
        alert("Unable to upload File to Pinata");
      } finally {
        setLoading(false);
      }
    }
  };

  const retrieveFile = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  return (
    <div className="flex justify-center items-center mt-12">
      <form
        className="flex flex-col items-center space-y-6 bg-gray-800 text-white p-6 rounded-xl shadow-2xl w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        {/* Title */}
        <h2 className="text-2xl font-bold tracking-wide text-gray-100">
          Upload Your File
        </h2>

        {/* Choose File Button */}
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg shadow-md hover:scale-105 transition-all duration-300"
        >
          Choose File
        </label>

        {/* Hidden File Input */}
        <input
          disabled={!account}
          type="file"
          id="file-upload"
          name="data"
          onChange={retrieveFile}
          className="hidden"
        />

        {/* Selected File Name */}
        <span className="text-gray-300 font-medium">{fileName}</span>

        {/* Upload Button */}
        <button
          type="submit"
          className={`${!file
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-500 hover:scale-105"
            } text-white font-semibold px-6 py-2 rounded-lg flex items-center justify-center shadow-md transition-all duration-300`}
          disabled={!file || loading}
        >
          {loading ? (
            <>
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
            "Upload File"
          )}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
