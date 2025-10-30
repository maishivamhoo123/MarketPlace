import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import MarketPlaceABI from "./MarketPlace.json";
import "./App.css"; // We will create this file next

const contractAddress = "0x8c1DCf97Df172515EA8d7386C6a200eD41C0dFA0"; // update if needed

export default function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [contract, setContract] = useState(null);
  const [items, setItems] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");

  // Edit form fields
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImage, setEditImage] = useState("");

  useEffect(() => {
    if (!window.ethereum) alert("Please install MetaMask!");
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not installed!");
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddress = accounts[0];
      setAccount(userAddress);

      const balanceWei = await provider.getBalance(userAddress);
      setBalance(formatEther(balanceWei));

      const marketContract = new Contract(contractAddress, MarketPlaceABI, signer);
      setContract(marketContract);

      await loadAllItems(marketContract);
      await loadWatchlist(marketContract, userAddress);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const loadAllItems = async (marketContract = contract) => {
    if (!marketContract) return;
    try {
      const count = await marketContract.itemCount();
      const itemList = [];
      for (let i = 1; i <= Number(count); i++) {
        const raw = await marketContract.items(i);
        if (raw.isDeleted) continue;
        itemList.push({
          id: Number(raw.id),
          name: raw.name,
          price: raw.price,
          image: raw.image,
          seller: raw.seller,
          owner: raw.owner,
          isSold: raw.isSold,
          isDeleted: raw.isDeleted,
          isFavourite: raw.isFavourite ?? false,
        });
      }
      setItems(itemList);
    } catch (err) {
      console.error("Failed to load items:", err);
    }
  };

  const loadWatchlist = async (marketContract = contract, user = account) => {
    if (!marketContract || !user) return;
    try {
      const ids = await marketContract.getWatchlist(user);
      const wl = [];
      for (let id of ids) {
        const raw = await marketContract.items(id);
        if (raw.isDeleted) continue;
        wl.push({
          id: Number(raw.id),
          name: raw.name,
          price: raw.price,
          image: raw.image,
          seller: raw.seller,
          owner: raw.owner,
        });
      }
      setWatchlist(wl);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
    }
  };

  const listItem = async () => {
    if (!contract) return alert("Connect wallet first");
    if (!name || !price || !image) return alert("Enter name, price, and image URL");

    try {
      const tx = await contract.listItem(name, parseEther(price), image, { gasLimit: 500000 });
      await tx.wait();
      await loadAllItems(contract);
      setName("");
      setPrice("");
      setImage("");
      setShowModal(false);
    } catch (err) {
      console.error("Failed to list item:", err);
    }
  };

  const buyItem = async (id, itemPrice) => {
    if (!contract) return alert("Connect wallet first");
    try {
      const tx = await contract.buyItem(id, { value: itemPrice, gasLimit: 500000 });
      await tx.wait();
      await loadAllItems(contract);
      await loadWatchlist(contract, account);
    } catch (err) {
      console.error("Failed to buy item:", err);
    }
  };

  const transferItem = async (id, toAddress) => {
    if (!contract) return alert("Connect wallet first");
    if (!toAddress) return alert("Enter recipient address");
    try {
      const tx = await contract.transferItem(id, toAddress, { gasLimit: 500000 });
      await tx.wait();
      await loadAllItems(contract);
      await loadWatchlist(contract, account);
    } catch (err) {
      console.error("Failed to transfer item:", err);
    }
  };

  const deleteItem = async (id) => {
    if (!contract) return alert("Connect wallet first");
    try {
      const tx = await contract.deleteItem(id, { gasLimit: 500000 });
      await tx.wait();
      await loadAllItems(contract);
      await loadWatchlist(contract, account);
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const addToWatchlist = async (id) => {
    if (!contract) return alert("Connect wallet first");
    try {
      const tx = await contract.addToWatchlist(id, { gasLimit: 200000 });
      await tx.wait();
      await loadWatchlist(contract, account);
      alert("Added to watchlist");
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
    }
  };

  const removeFromWatchlist = async (id) => {
    if (!contract) return alert("Connect wallet first");
    try {
      const tx = await contract.removeFromWatchlist(id, { gasLimit: 200000 });
      await tx.wait();
      await loadWatchlist(contract, account);
      alert("Removed from watchlist");
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
    }
  };

  const toggleFavourite = async (id) => {
    if (!contract) return alert("Connect wallet first");
    try {
      const tx = await contract.toggleFavourite(id, { gasLimit: 200000 });
      await tx.wait();
      await loadAllItems(contract);
      alert("Favourite toggled");
    } catch (err) {
      console.error("Failed to toggle favourite:", err);
    }
  };

  const openEditModal = (item) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPrice(formatEther(item.price));
    setEditImage(item.image);
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    if (!contract) return alert("Connect wallet first");
    if (!editingItemId) return;
    try {
      const priceWei = editPrice ? parseEther(editPrice) : 0;
      const tx = await contract.editItem(editingItemId, editName, priceWei, editImage, { gasLimit: 300000 });
      await tx.wait();
      setShowEditModal(false);
      setEditingItemId(null);
      await loadAllItems(contract);
      await loadWatchlist(contract, account);
    } catch (err) {
      console.error("Failed to edit item:", err);
    }
  };

  const getItemsByOwner = async () => {
    if (!contract) return alert("Connect wallet first");
    if (!ownerAddress) return alert("Enter owner address");
    try {
      const ids = await contract.getItemByOwner(ownerAddress);
      const ownedItems = [];
      for (let id of ids) {
        const raw = await contract.items(id);
        if (!raw.isDeleted) {
          ownedItems.push({
            id: Number(raw.id),
            name: raw.name,
            price: raw.price,
            image: raw.image,
            seller: raw.seller,
            owner: raw.owner,
          });
        }
      }
      setItems(ownedItems);
    } catch (err) {
      console.error("Failed to get items by owner:", err);
    }
  };

  // re-load watchlist whenever account or contract changes
  useEffect(() => {
    if (!contract || !account) return;
    loadAllItems(contract);
    loadWatchlist(contract, account);
  }, [contract, account]);

  // Helper function to render item cards
  const renderItemCard = (item) => (
    <div className="item-card" key={item.id}>
      <div className="item-image-container">
        <img src={item.image} alt={item.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found'; }} />
      </div>
      <div className="item-details">
        <h3>{item.name}</h3>
        <p className="item-price">
          <img src="https://orange-defeated-hedgehog-488.mypinata.cloud/ipfs/bafkreihklw5a27don7a7mfqwn6wzrkk5euqrsyopda6tjwrm2nolzrejze" alt="Flow logo" className="flow-icon" />
          {formatEther(item.price)}
        </p>
      </div>
      <div className="item-meta">
        <p><b>Seller:</b> {item.seller.slice(0, 6)}...{item.seller.slice(-4)}</p>
        <p><b>Owner:</b> {item.owner.slice(0, 6)}...{item.owner.slice(-4)}</p>
      </div>

      <div className="item-actions">
        {/* --- Public Actions --- */}
        {!item.isSold && item.owner.toLowerCase() !== account.toLowerCase() && (
          <button className="btn-primary" onClick={() => buyItem(item.id, item.price)}>Buy Now</button>
        )}
        
        {/* Show "Sold" badge if sold */}
        {item.isSold && <span className="badge-sold">Sold</span>}

        <button className="btn-secondary" onClick={() => addToWatchlist(item.id)}>Add to Watchlist</button>

        {/* --- Owner Actions --- */}
        {item.owner.toLowerCase() === account.toLowerCase() && (
          <div className="owner-actions">
            <button className={`btn-owner ${item.isFavourite ? 'toggled' : ''}`} onClick={() => toggleFavourite(item.id)}>
              {item.isFavourite ? "★ Unfavourite" : "☆ Mark Favourite"}
            </button>
            <div className="transfer-group">
              <input type="text" placeholder="Transfer to 0x..." id={`to${item.id}`} />
              <button className="btn-owner" onClick={() => transferItem(item.id, document.getElementById(`to${item.id}`).value)}>Transfer</button>
            </div>
            <div className="owner-buttons-row">
              <button className="btn-owner" onClick={() => openEditModal(item)}>Edit</button>
              <button className="btn-danger" onClick={() => deleteItem(item.id)}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
       <div className="logo">
        <img
          src="https://orange-defeated-hedgehog-488.mypinata.cloud/ipfs/bafybeiaeykta7odi6inyrpuq3grh5q62gyc4jkj3a2u3fy5kqmzwwbdiba"
          alt="Flow logo"
        />
        <h1>Flow Market</h1>
      </div>

        {account && (
          <div className="nav-buttons">
            <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
            <button className={activeTab === 'myproducts' ? 'active' : ''} onClick={() => setActiveTab("myproducts")}>My Products</button>
            <button className={activeTab === 'watchlist' ? 'active' : ''} onClick={() => setActiveTab("watchlist")}>Watchlist</button>
          </div>
        )}
        
        <div className="nav-actions">
          {account && (
            <button className="btn-secondary" onClick={() => setShowModal(true)}>+ List Item</button>
          )}
          {account && (
            <div className="wallet-info-box">
              <p className="wallet-balance">{Number(balance).toFixed(4)} <span>FLOW</span></p>
              <p className="wallet-address">{account.slice(0, 6)}...{account.slice(-4)}</p>
            </div>
          )}
        </div>
      </nav>

      {!account ? (
        <div className="connect-section">
          <div className="connect-content">
            <h2>Welcome to the Flow Marketplace</h2>
            <p>Connect your wallet to buy, sell, and trade digital assets on the Flow network.</p>
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      ) : (
        <main className="content-wrapper">
          <section className="tab-content">
            {activeTab === "dashboard" && (
        <>
          <h2>🌐 All Marketplace Items</h2>
          <div className="items-grid">
            {items.filter(item => !item.isSold && !item.isDeleted).length === 0 ? (
              <p className="empty-state">No active items available.</p>
            ) : (
              items
                .filter(item => !item.isSold && !item.isDeleted)
                .map(renderItemCard)
            )}
          </div>
        </>
      )}


          {activeTab === "myproducts" && (
        <>
          <h2>🧾 My Products</h2>

          {/* === Active (unsold) items === */}
          <h3>🟢 Active Items</h3>
          <div className="items-grid">
            {items
              .filter(item =>
                item.owner.toLowerCase() === account.toLowerCase() &&
                !item.isSold &&
                !item.isDeleted
              ).length === 0 ? (
                <p className="empty-state">You don't have any active (unsold) items.</p>
              ) : (
                items
                  .filter(item =>
                    item.owner.toLowerCase() === account.toLowerCase() &&
                    !item.isSold &&
                    !item.isDeleted
                  )
                  .map(renderItemCard)
              )}
          </div>

          {/* === Sold items === */}
          <h3 style={{ marginTop: "2rem" }}>💰 Sold Items</h3>
          <div className="items-grid">
            {items
              .filter(item =>
                item.owner.toLowerCase() === account.toLowerCase() &&
                item.isSold &&
                !item.isDeleted
              ).length === 0 ? (
                <p className="empty-state">You don't have any sold items.</p>
              ) : (
                items
                  .filter(item =>
                    item.owner.toLowerCase() === account.toLowerCase() &&
                    item.isSold &&
                    !item.isDeleted
                  )
                  .map(item => (
                    <div className="item-card" key={item.id}>
                      <div className="item-image-container">
                        <img
                          src={item.image}
                          alt={item.name}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found'; }}
                        />
                      </div>
                      <div className="item-details">
                        <h3>{item.name}</h3>
                        <p className="item-price">
                          <img
                            src="https://orange-defeated-hedgehog-488.mypinata.cloud/ipfs/bafkreihklw5a27don7a7mfqwn6wzrkk5euqrsyopda6tjwrm2nolzrejze"
                            alt="Flow logo"
                            className="flow-icon"
                          />
                          {formatEther(item.price)}
                        </p>
                      </div>
                      <div className="item-meta">
                        <p><b>Seller:</b> {item.seller.slice(0, 6)}...{item.seller.slice(-4)}</p>
                        <p><b>Owner:</b> {item.owner.slice(0, 6)}...{item.owner.slice(-4)}</p>
                      </div>
                      <div className="transfer-group">
                        <input
                          type="text"
                          placeholder="Transfer to 0x..."
                          id={`to${item.id}`}
                        />
                        <button
                          className="btn-owner"
                          onClick={() =>
                            transferItem(item.id, document.getElementById(`to${item.id}`).value)
                          }
                        >
                          Transfer
                        </button>
                      </div>
                    </div>
                  ))
              )}
          </div>
        </>
      )}




            {activeTab === "watchlist" && (
              <>
                <h2>👀 My Watchlist</h2>
                {watchlist.length === 0 ? (
                  <p className="empty-state">Your watchlist is empty. Add items from the dashboard.</p>
                ) : (
                  <div className="items-grid">
                    {watchlist.map((item) => (
                      <div className="item-card" key={item.id}>
                        <div className="item-image-container">
                          <img src={item.image} alt={item.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found'; }} />
                        </div>
                        <div className="item-details">
                          <h3>{item.name}</h3>
                          <p className="item-price">
                             <img src="https://orange-defeated-hedgehog-488.mypinata.cloud/ipfs/bafkreihklw5a27don7a7mfqwn6wzrkk5euqrsyopda6tjwrm2nolzrejze" alt="Flow logo" className="flow-icon" />
                             {formatEther(item.price)}
                          </p>
                        </div>
                        <div className="item-actions">
                          <button className="btn-primary" onClick={() => buyItem(item.id, item.price)}>Buy Now</button>
                          <button className="btn-danger" onClick={() => removeFromWatchlist(item.id)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      )}

      {/* Modal for Add New Item */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🪙 Add New Item for Sale</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Item Name</label>
                <input placeholder="e.g. CryptoPunk #1234" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Price (in FLOW / ETH)</label>
                <input placeholder="e.g. 1.5" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input placeholder="https://... or ipfs://..." value={image} onChange={(e) => setImage(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={listItem}>List Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Edit Item */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
             <div className="modal-header">
                <h3>✏️ Edit Item</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
             </div>
            <div className="modal-body">
               <div className="form-group">
                 <label>Item Name</label>
                <input placeholder="Item Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
               <div className="form-group">
                 <label>Price (in FLOW / ETH)</label>
                <input placeholder="Price in ETH" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>
               <div className="form-group">
                 <label>Image URL</label>
                <input placeholder="Image URL (IPFS / https)" value={editImage} onChange={(e) => setEditImage(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}