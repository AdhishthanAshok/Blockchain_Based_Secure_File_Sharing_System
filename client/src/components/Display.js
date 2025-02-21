import { useState } from "react";

const Display = ({ contract, account }) => {
  const [data, setData] = useState([]);

  const getdata = async () => {
    let dataArray;
    const Otheraddress = document.querySelector(".address").value.trim();

    try {
      dataArray = Otheraddress
        ? await contract.display(Otheraddress)
        : await contract.display(account);

      console.log("Data returned from contract", dataArray);
    } catch (e) {
      alert("You don't have access");
      return;
    }

    if (dataArray.length > 0) {
      const images = dataArray.map((item, i) => {
        let ipfsUrl = item.startsWith("ipfs://")
          ? `https://gateway.pinata.cloud/ipfs/${item.substring(6)}`
          : item;

        return (
          <a
            href={ipfsUrl}
            key={i}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            <img
              src={ipfsUrl}
              alt="Uploaded File"
              className="w-full h-72 object-cover"
            />
          </a>
        );
      });

      setData(images);
    } else {
      alert("No images to display");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-screen-lg overflow-y-auto">
        {data}
      </div>

      <input
        type="text"
        placeholder="Enter Address"
        className="w-80 h-10 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-center address"
      />

      <button
        onClick={getdata}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105"
      >
        Get Data
      </button>
    </div>
  );
};

export default Display;
