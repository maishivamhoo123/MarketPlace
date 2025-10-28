# 🛍️ Flow Marketplace (React + Ethers.js)

A simple **decentralized marketplace dApp** built on **Flow EVM** using **React** and **ethers.js**.  
Users can **list**, **buy**, **transfer**, and **view** items directly from their wallet — all on-chain.

---

## 🚀 Features

- 🔗 **Connect MetaMask** wallet  
- 💰 **View wallet balance** (in FLOW/ETH)  
- 🏷️ **List new items** for sale  
- 🛒 **Buy listed items** using crypto  
- 🔄 **Transfer ownership** of purchased items  
- 👤 **View items owned by a specific address**

---

## 🧩 Tech Stack

| Layer | Technology |
|:------|:------------|
| Frontend | React.js (Vite / CRA) |
| Blockchain Interaction | Ethers.js |
| Smart Contract | Solidity (Marketplace contract) |
| Network | Flow EVM (or compatible testnet) |
| Wallet | MetaMask |

---

## 📂 Project Structure

flow-marketplace/
│
├── src/
│ ├── App.js # Main React component
│ ├── MarketPlace.json # ABI of deployed smart contract
│ └── index.js # Entry point
│
├── package.json
├── README.md
└── ...

yaml
Copy code

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/yourusername/flow-marketplace.git
cd flow-marketplace
2️⃣ Install dependencies
bash
Copy code
npm install
3️⃣ Update contract address
In App.js, replace the placeholder with your deployed contract address:

js
Copy code
const contractAddress = "0xYourContractAddressHere";
4️⃣ Start the app
bash
Copy code
npm run dev
Then open:
👉 http://localhost:5173/ (or the port shown in your terminal)

🔗 Connect Wallet
Click “Connect Wallet” to connect your MetaMask account.
Once connected, the app will show your address and balance.

🏷️ List Item
Enter an item name and price in FLOW/ETH.

Click “List Item” to add it to the marketplace.

🛒 Buy Item
View all listed items under “All Items”.

Click “Buy” to purchase an item (requires sufficient balance).

🔁 Transfer Item
Owners can transfer purchased items to another address.

Enter the recipient’s address and click “Transfer”.

👤 Get Items by Owner
Enter an owner wallet address.

Click “Get Items” to view all items owned by that address.

💡 Notes
Ensure you are connected to the Flow EVM network in MetaMask.

The contract ABI file (MarketPlace.json) must match your deployed contract.

You can adjust gasLimit values if transactions fail due to gas issues.

🧠 Smart Contract Overview
The MarketPlace.sol contract supports:

solidity
Copy code
function ListItems(string memory name, uint price) public;
function buyItem(uint id) public payable;
function transferItem(uint id, address to) public;
function getItemByOwner(address owner) public view returns (uint[] memory);
It tracks ownership, price, and sold status of each item.

🪙 Example Environment
Parameter	Example
Network	Flow EVM Testnet
Wallet	MetaMask
Example Contract	0x8C8e1ca7E7775d49DEEEeC66ABaAc401Eeb1f684

📜 License
This project is licensed under the MIT License.
Feel free to modify and build upon it!