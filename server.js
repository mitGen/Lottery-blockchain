const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Web3 = require('web3');
const solc = require('solc');
const util = require('util');
const path = require('path');

let bin, abi, web3, time, balanceOfContr;

//info contract
let activeContract, addressContract, owner, dateDeployContract;

//info payments player
let lotteryPlayer = [], inactivePlayer = [], lengthInactivePlayer, winnerPlayer;

//connecting network
function setUp() {
  const source = fs.readFileSync('./ethereum/lottery.sol', 'UTF-8');
  const compiled = solc.compile(source);
  bin = compiled.contracts[':MyLottery'].bytecode;
  abi = JSON.parse(compiled.contracts[':MyLottery'].interface);
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}
setUp();

//Deploy contract in network
async function ContractDeploy(res, walletNumber, passWallet){
  owner = walletNumber;
  const contract = new web3.eth.Contract(abi);

  try{
    await web3.eth.personal.unlockAccount(walletNumber, passWallet);
    contract.deploy({data:'0x' + bin})
    .send({
      from: walletNumber,
      gas: 3000000
    })
    .on('receipt', receipt => {
      activeContract = true;
      addressContract = receipt.contractAddress;
      overPage(res);
      timer();
    })
    .on('error', err => {
      console.log(err)
      verification(res, 'Error processing request on Smart Contract')
    })
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
}

//transfer to contract player
async function TransferToContract(res, addrParty, passParty, value){
  //value transfer ether on contract
  let valueEth = value * Math.pow(10, 18);
  let contract = new web3.eth.Contract(abi, addressContract);

    try{
      //check balance address who conducts the transaction
      await web3.eth.getBalance(addrParty);
  
      await web3.eth.personal.unlockAccount(addrParty, passParty);
      await contract.methods.TransferEtherContract()
        .send({
          from: addrParty,
          value: valueEth,
          gas:1000000
        })
        .on('error', error => {
          console.log(error);
        });

        //length inactive User
        inactivePlayer = [];
        let lengthInactive = await contract.methods.lengthInactiveUsers().call();
        lengthInactivePlayer = +lengthInactive;

        for(let i = 0; i < lengthInactivePlayer; i++){
        //information inactive user
          let inactive = await contract.methods.inactiveUser(i).call();
          inactivePlayer.push(inactive);
          inactivePlayer[i][2] = new Date(+inactivePlayer[i][2]*1000);
        }

        //information winner player
        winnerPlayer = await contract.methods.getWinnerPlay().call();
        winnerPlayer[2] = new Date(+winnerPlayer[2]*1000);

        //check the number of participants in the lottery
        balanceOfContr = await web3.eth.getBalance(addressContract);

        // getting the number of participants
        let lengthUsers = await contract.methods.lengthUsers().call();
        let countLimitPlayer = await contract.methods.countLimitPlayer().call();

        //information player lottery
        lotteryPlayer = [];
        console.log(lengthUsers, +lengthUsers)
        for(let i = 0; i < +lengthUsers; i++){
          let users = await contract.methods.getUsers(i).call();
          lotteryPlayer.push(users);
          lotteryPlayer[i][2] = new Date(+lotteryPlayer[i][2]*1000);
        }
        //check max length player smart contract 
        if(+lengthUsers >= +countLimitPlayer && addrParty !== owner){
          changeLot(contract);
          resServer(res, 200, '');
        }else{
          let response = JSON.stringify({
            "success":"Transaction was sacsessful",
            "balanceOf": balanceOfContr
          });
          resServer(res, 200, response);
        }
    }catch(err){
      console.log(err)
      verification(res, 'Wrong address or password');
    }
}

//current time timer
function timer(res){
  time = 0;
  const fourthOfJuly = new Date().getTime() + 1000*60*60*24*7;
  time = fourthOfJuly - new Date().getTime();
  let backTimer = setInterval(function(){
    const today = new Date().getTime();
    time = fourthOfJuly - today;
    if(time <= 0){
      clearInterval(backTimer);
      changeLot();
    }
  },1000)
}

//change active lottery
async function changeLot(contract){
  try{
    activeContract = false;

    await contract.methods.changeActiveSmart(false)
      .send({
        from: owner,
        gas: 50000
      })
  }catch(err){
    console.log(err);
    console.log('Error receive data');
  }
}

//restart lottery
async function restart(res, password){
  let contract = new web3.eth.Contract(abi, addressContract);
  try{
    await web3.eth.personal.unlockAccount(owner, password);
    contract.methods.restartLottery().send({
      from:owner,
      gas:1000000
    });
    timer(res);
    lotteryPlayer = [];
    inactivePlayer = [];
    lengthInactivePlayer = 0;
    winnerPlayer = 0;
  }catch(err){
    console.log(err)
  }

}

                          //SERVER PART//

function resServer(res, status, argument){
  res.writeHead(status, {'Content-Type':'text/plain'});
  res.end(argument);
}

//login and password verification function
function verification(res, typeError){
  res.writeHead(403, {'Content-Type':'text/plain'});
  res.end(typeError);
}

//function processing error
function handleError(error, res){
  res.writeHead(500, {'Content-Type':'text/plain'});
  res.end(error)
}

//function page player
function overPage(res){
  fs.readFile(path.join(__dirname, 'public', 'study.html'), (err, data) => {
    if(err) return handleError(err, res);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(data);
  });
}

//deploy contract and transfer eth
const app = express();

app.use(express.static(__dirname));
let urlEncodeParser = bodyParser.urlencoded({extended: false});

//main page
app.get('/', (req, res) => {
  if(addressContract) return res.redirect('/contract');
  fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, result) => {
    if(err) return handleError(err, res);
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(result);
  })
})

//deploy contract in network
app.route('/contract')
  .get((req, res) => {
    if(addressContract){
      overPage(res);
    }else{
      res.redirect('/');
    }
  })
  .post(urlEncodeParser, (req, res) => {
    let wallet = req.body.wallet.trim();
    ContractDeploy(res, wallet, req.body.password);
})

//trnsfer eth on contract
app.post("/transfer", urlEncodeParser, (req, res) => {
  let data = {};
  for(var key in req.body){
    data[key.trim()] = req.body[key].trim();
  }
  TransferToContract(res, data.wallet, data.password, +data.value);
})

//back timer
app.get('/timing', (req, res) => {
  resServer(res, 200, time.toString());
})

//balance contract
app.get('/balance', (req, res) => {
  resServer(res, 200, balanceOfContr);
})

              //INFORMATION ABOUT THE CONDITION SMART CONTRACT

//receive information lottery
app.get('/host/api/info', (req, res) => {
  let infoOwner = {
    "description":"Info state smart contract",
    "addrContr": addressContract,
    "owner": owner,
    'dateTime': dateDeployContract,
    "active": activeContract,
  };
  resServer(res, 200, JSON.stringify(infoOwner));
})

//recive information player lottery
app.get('/host/api/payments', (req, res) => {
  resServer(res, 200, JSON.stringify(lotteryPlayer));
})

app.get('/host/api/inactive-payments', (req, res) => {
  resServer(res, 200, JSON.stringify(inactivePlayer));
})

app.get('/host/api/result', (req, res) => {
  resServer(res, 200, JSON.stringify(winnerPlayer));
})
//restart lottery
app.post('/restart', urlEncodeParser,  (req, res)=>{
  let pass
  for(var key in req.body){
    pass = req.body[key].trim();
  }
  restart(res, pass);
})
app.listen(3000, () => console.log('Server started'))
