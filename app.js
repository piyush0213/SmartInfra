// Wait for the DOM to load
window.addEventListener('load', async () => {
    // Connect Wallet Button
    const connectWalletButton = document.getElementById('connectWallet');
    connectWalletButton.addEventListener('click', connectWallet);

    async function connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                connectWalletButton.innerText = 'Wallet Connected 💳';
                console.log('Wallet connected');
            } catch (error) {
                console.error('User denied account access');
            }
        } else {
            alert('Please install Metamask to use this dApp.');
        }
    }

    // IPFS and Pinata Configuration
    const pinataApiKey = '7aa555dbd1cbd26067af';
    const pinataSecretApiKey = '16fa7dfe200ddc1d16ca18b47da8a6bd90eb06bbc23703650bab6d47d136f426';

    async function uploadFileToPinata(file) {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        let data = new FormData();
        console.log(data)
        data.append('file', file);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            },
            body: data
        });

        const result = await response.json();
        return result.IpfsHash;
    }

    // Smart Contract Configuration
    const contractABI = [[
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_id",
                    "type": "uint256"
                }
            ],
            "name": "markResolved",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "description",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "reporter",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "ipfsHash",
                    "type": "string"
                }
            ],
            "name": "NewReport",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_description",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "_ipfsHash",
                    "type": "string"
                }
            ],
            "name": "submitReport",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getReports",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "id",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string",
                            "name": "description",
                            "type": "string"
                        },
                        {
                            "internalType": "address",
                            "name": "reporter",
                            "type": "address"
                        },
                        {
                            "internalType": "bool",
                            "name": "resolved",
                            "type": "bool"
                        },
                        {
                            "internalType": "string",
                            "name": "ipfsHash",
                            "type": "string"
                        }
                    ],
                    "internalType": "struct CivicChain.Report[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "reportCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "reports",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "id",
                    "type": "uint256"
                },
                {
                    "internalType": "string",
                    "name": "description",
                    "type": "string"
                },
                {
                    "internalType": "address",
                    "name": "reporter",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "resolved",
                    "type": "bool"
                },
                {
                    "internalType": "string",
                    "name": "ipfsHash",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]];
    const contractAddress = '0xf8e81D47203A594245E36C48e151709F0C19fBe8'; // Replace with your contract address

    let web3;
    let smartInfraContract;

    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        smartInfraContract = new web3.eth.Contract(contractABI, contractAddress);
    } else {
        alert('Please install Metamask to use this dApp.');
    }

    // Handle Form Submission
    const reportForm = document.getElementById('report-damage');
    reportForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const description = document.getElementById('damage-description').value;
        const location = document.getElementById('location-description').value;
        const imageFile = document.getElementById('damage-image').files[0];

        if (!description || !location || !imageFile) {
            alert('Please fill in all fields and select an image.');
            return;
        }

        try {
            // Upload image to Pinata
            const ipfsHash = await uploadFileToPinata(imageFile);
            console.log('Image uploaded to IPFS with hash:', ipfsHash);

            // Submit report to the smart contract
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            await smartInfraContract.methods.submitDamageReport(description, location, ipfsHash)
                .send({ from: accounts[0] });

            alert('Report submitted successfully!');
            // Clear the form
            reportForm.reset();
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('An error occurred while submitting the report.');
        }
    });
});
