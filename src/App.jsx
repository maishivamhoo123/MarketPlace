import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import MarketPlaceABI from "./MarketPlace.json";

// Your deployed contract on Flow EVM
const contractAddress = "0x8C8e1ca7E7775d49DEEEeC66ABaAc401Eeb1f684";

function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [contract, setContract] = useState(null);
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");

  useEffect(() => {
    if (!window.ethereum) alert("Please install MetaMask!");
  }, []);

  // Connect wallet and setup contract
  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not installed!");
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddress = accounts[0];
      setAccount(userAddress);

      // Get wallet balance
      const balanceWei = await provider.getBalance(userAddress);
      setBalance(formatEther(balanceWei));

      // Set up contract
      const marketContract = new Contract(contractAddress, MarketPlaceABI, signer);
      setContract(marketContract);

      // Load items
      await loadAllItems(marketContract);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  // Load all items
  const loadAllItems = async (marketContract) => {
    if (!marketContract) return;
    try {
      const count = await marketContract.itemCount();
      const itemList = [];
      for (let i = 1; i <= count; i++) {
        const item = await marketContract.items(i);
        itemList.push(item);
      }
      setItems(itemList);
    } catch (err) {
      console.error("Failed to load items:", err);
    }
  };

  // List item
  const listItem = async () => {
    if (!contract) return alert("Connect wallet first");
    if (!name || !price) return alert("Enter name and price");

    try {
      const tx = await contract.ListItems(name, parseEther(price), { gasLimit: 500000 });
      await tx.wait();
      await loadAllItems(contract);
      setName("");
      setPrice("");
    } catch (err) {
      console.error("Failed to list item:", err);
    }
  };

  // Buy item
  const buyItem = async (id, itemPrice) => {
    if (!contract) return alert("Connect wallet first");
    try {
      const tx = await contract.buyItem(id, { value: itemPrice, gasLimit: 500000 });
      await tx.wait();
      await loadAllItems(contract);
    } catch (err) {
      console.error("Failed to buy item:", err);
    }
  };

  // Transfer item
  const transferItem = async (id, toAddress) => {
    if (!contract) return alert("Connect wallet first");
    if (!toAddress) return alert("Enter recipient address");
    try {
      const tx = await contract.transferItem(id, toAddress, { gasLimit: 500000 });
      await tx.wait();
      await loadAllItems(contract);
    } catch (err) {
      console.error("Failed to transfer item:", err);
    }
  };

  // Get items by owner
  const getItemsByOwner = async () => {
    if (!contract) return alert("Connect wallet first");
    if (!ownerAddress) return alert("Enter owner address");
    try {
      const ids = await contract.getItemByOwner(ownerAddress);
      const ownedItems = [];
      for (let id of ids) {
        const item = await contract.items(id);
        ownedItems.push(item);
      }
      setItems(ownedItems);
    } catch (err) {
      console.error("Failed to get items by owner:", err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Flow Marketplace (Simplified)</h2>

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p><b>Address:</b> {account}</p>
          <p><b>Balance:</b> {balance} FLOW / ETH</p>
        </div>
      )}

      <hr />
      <h3>List Item</h3>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginRight: "10px" }}
      />
      <input
        placeholder="Price in FLOW/ETH"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        style={{ marginRight: "10px" }}
      />
      <button onClick={listItem}>List Item</button>

      <hr />
      <h3>All Items</h3>
      {items.length === 0 ? (
        <p>No items available</p>
      ) : (
        items.map((item) => (
          <div
            key={item.Id}
            style={{ border: "1px solid gray", margin: "5px", padding: "5px" }}
          >
            <p>ID: {item.Id}</p>
            <p>Name: {item.name}</p>
            <p>Price: {formatEther(item.price)} FLOW</p>
            <p>Seller: {item.seller}</p>
            <p>Owner: {item.owner}</p>
            <p>Sold: {item.isSold ? "Yes" : "No"}</p>

            {item.owner.toLowerCase() !== account.toLowerCase() && !item.isSold && (
              <button onClick={() => buyItem(item.Id, item.price)}>Buy</button>
            )}

            {item.owner.toLowerCase() === account.toLowerCase() && (
              <div style={{ marginTop: "5px" }}>
                <input placeholder="Transfer to" id={`to${item.Id}`} />
                <button
                  onClick={() =>
                    transferItem(item.Id, document.getElementById(`to${item.Id}`).value)
                  }
                >
                  Transfer
                </button>
              </div>
            )}
          </div>
        ))
      )}

      <hr />
      <h3>Get Items by Owner</h3>
      <input
        placeholder="Owner address"
        value={ownerAddress}
        onChange={(e) => setOwnerAddress(e.target.value)}
        style={{ marginRight: "10px" }}
      />
      <button onClick={getItemsByOwner}>Get Items</button>
    </div>
  );
}

export default App;
