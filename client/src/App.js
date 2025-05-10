import Upload from "./artifacts/contracts/Upload.sol/Upload.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display";
import Modal from "./components/Modal";

/**
    * Asynchronously loads the Ethereum provider and sets up event listeners for chain and account changes.
    * Requests access to the user's Ethereum accounts and retrieves the signer and address.
    * Initializes a smart contract instance using the provided ABI and contract address.
    * Updates the state with the provider, account address, and contract instance.
    *
    * @async
    * @function loadProvider
    * @throws Will log an error if MetaMask is not installed.
    *
    * Variables:
    * - `provider`: Represents the Ethereum provider (e.g., MetaMask) used to interact with the blockchain.
    * - `signer`: An abstraction of an Ethereum account that can sign transactions.
    * - `address`: The Ethereum address of the connected account.
    * - `contractAddress`: The address of the deployed smart contract on the blockchain.
    * - `contract`: An instance of the smart contract, allowing interaction with its methods.
    */

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const loadProvider = async () => {
      if (provider) {
        window.ethereum.on("chainChanged", () => window.location.reload());
        window.ethereum.on("accountsChanged", () => window.location.reload());

        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const contract = new ethers.Contract(contractAddress, Upload.abi, signer);

        setContract(contract);
        setProvider(provider);
      } else {
        console.error("Metamask is not installed");
      }
    };

    provider && loadProvider();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center relative px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 opacity-40"></div>

      <header className="text-center mt-10 z-10">
        <h1 className="text-3xl sm:text-4xl pt-10 font-bold mb-3">Decentralized File Sharing System</h1>
        <p className="text-lg sm:text-xl text-gray-300">
          {account ? `Connected Account: ${account}` : "Not Connected"}
        </p>
      </header>

      {/* Share Button at Top Left */}
      <div className="absolute top-4 left-4 z-50 sm:left-8 md:left-12 lg:left-16">
        {!modalOpen ? (
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-transform transform hover:scale-105"
            onClick={() => setModalOpen(true)}
          >
            Share Files
          </button>
        ) : (
          <Modal setModalOpen={setModalOpen} contract={contract} />
        )}
      </div>

      <main className="flex flex-col items-center justify-center w-full mt-10 z-10">
        <FileUpload account={account} provider={provider} contract={contract} />

        <section className="w-full max-w-screen-lg mt-8 mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-center">Your Files</h2>
          <Display contract={contract} account={account} />
        </section>
      </main>
    </div>
  );
}

export default App;