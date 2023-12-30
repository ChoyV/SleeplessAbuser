const ethers = require('ethers');
const fs = require('fs').promises;
const { format } = require('date-fns');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/bsc');
const gasPrice = ethers.parseUnits('1', 'gwei');
const gasLimit = 70000;
const contractAbi = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_numCheckins",
        "type": "uint256"
      }
    ],
    "name": "checkIn",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
  // Add more entries if your contract has more functions
];
async function CheckIn(privateKey) {
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract('0xCac410CD44717311F63aAf6081CB07244F10844f', contractAbi, wallet);

  try {
    const tx = await contract.checkIn(0, { gasLimit: gasLimit });
    const receipt = await tx.wait();
    let currentDate = getCurrentDate();
    console.log('Successful CheckIn!\nTransaction Hash:', receipt.hash, `Time of TX:`, currentDate);
    appendToLogFile(`\nCheckIn hash: ${receipt.hash}\nTime of TX: ${currentDate}\n`);
    return true;
  } catch (error) {
    console.error('Error in CheckIn:', error);
    appendToLogFile(`Error in CheckIn: ${error.message}\n`);
    return false;
  }
}

async function Voting(privateKey) {
  const data = '0x1845e7890000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b0000000000000000000000000000000000000000000000000000000000000001';
  const wallet = new ethers.Wallet(privateKey, provider);
  const rawTransaction = {
    to: '0xCac410CD44717311F63aAf6081CB07244F10844f',
    data: data,
    gasLimit: gasLimit,
    gasPrice: gasPrice,
  };

  try {
    const transactionHash = await wallet.sendTransaction(rawTransaction);
    let currentDate = getCurrentDate();
    console.log('Transaction sent. Hash:', transactionHash.hash, `Time of TX:`, currentDate);
    appendToLogFile(`\nVoting hash: ${transactionHash.hash}\nTime of TX: ${currentDate}\n`);
    return true;
  } catch (error) {
    console.error('Error sending transaction:', error);
    appendToLogFile(`Error in CheckIn: ${error.message}\n`);
    return false;
  }
}

async function readPrivateKeysFromFile(filePath) {
  try {
    const privateKeys = await fs.readFile(filePath, 'utf-8');
    return privateKeys
      .split('\n')
      .map((key) => key.trim())
      .filter(Boolean);
  } catch (error) {
    console.error('Error reading private keys from file:', error.message);
    return [];
  }
}

async function processPrivateKeys(privateKeysFilePath) {
  const privateKeys = await readPrivateKeysFromFile(privateKeysFilePath);
  for (const privateKey of privateKeys) {
    let wallettoLog = new ethers.Wallet(privateKey, provider);
    let addressToLog = await wallettoLog.getAddress();
    appendToLogFile(`\nWallet: ${addressToLog}`);
    console.log(`Working with wallet:`, addressToLog);

    const checkInSuccess = await CheckIn(privateKey);
    if (!checkInSuccess) {
      console.log('CheckIn failed for wallet:', addressToLog);
      continue;
    }

    const votingSuccess = await Voting(privateKey);
    if (!votingSuccess) {
      console.log('Voting failed for wallet:', addressToLog);
      continue;
    }

    appendToLogFile(`\n`);
  }
  console.log('ALL WALLETS ARE DONE!');
}

async function appendToLogFile(logEntry) {
  const logFilePath = 'Logs.txt';
  try {
    await fs.appendFile(logFilePath, logEntry);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

function getCurrentDate() {
  return format(new Date(), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: 'Europe/Moscow' });
}

const privateKeysFilePath = 'logins.txt';
processPrivateKeys(privateKeysFilePath);