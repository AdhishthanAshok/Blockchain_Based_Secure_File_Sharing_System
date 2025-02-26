import { useState } from "react";

const Display = ({ contract, account }) => {
  const [data, setData] = useState("");

  const getdata = async () => {
    let dataArray;
    const Otheraddress = document.querySelector(".address").value;
    try {
      if (Otheraddress) {
        dataArray = await contract.display(Otheraddress);
        console.log("Data returned from contract", dataArray);
      } else {
        dataArray = await contract.display(account);
      }
    } catch (e) {
      alert("You don't have access");
    }

    const isEmpty = Object.keys(dataArray).length === 0;

    if (!isEmpty) {
      const str = dataArray.toString();
      const str_array = str.split(",");
      const images = str_array.map((item, i) => {
        console.log("IPFS item value:", item);

        let ipfsUrl = item;
        if (item.startsWith("ipfs://")) {
          ipfsUrl = `https://gateway.pinata.cloud/ipfs/${item.substring(6)}`;
        }

        if (item.includes("gateway.pinata.cloud/ipfs/")) {
          ipfsUrl = item;
        }

        return (
          <div key={i} className="p-2">
            <a
              href={ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className=" block overflow-hidden rounded-lg shadow-lg transform transition duration-300 hover:scale-105"
            >
              <div className="bg-white border border-black p-4 rounded-lg">
                <img
                  src={ipfsUrl}
                  alt={`image-${i}`}
                  className=" rounded-lg object-cover"
                />
              </div>
            </a>
          </div>
        );
      });

      setData(images);
    } else {
      alert("No image to display");
    }
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
          className="bg-blue-600 text-gray-900 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
        >
          Get Data
        </button>
      </div>
      {/* Centering and organizing the grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-center">
        {data}
      </div>
    </div>
  );
};

export default Display;
