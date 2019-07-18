"use strict"
window.onload = function(){
  let numWallet = document.getElementById('wallet');
  let password = document.getElementById('password');
  let valueEth = document.getElementById('valEth');
  let butDeploy = document.getElementById('butTransfer');
  let errorValid = document.getElementById('errorValid');
  let active = document.getElementById('active');
  let balanceOf = document.getElementById('balanceOf');
  let timers =  document.getElementById('timer').children;

  //getting information about smart contract
  let lotteryInfo = document.getElementById('lotteryInfo');
  let membersInfo = document.getElementById('membersInfo');
  let membersInactive = document.getElementById('membersInactive');
  let winner = document.getElementById('winner');
  let viewInformation = document.getElementById('information');
  let close = document.getElementById('close');

  //restart lottery
  let restart = document.getElementById('rest')

  //balance smart contract
  async function balanceSmartContract(){
    try{
      let sendRequest = await fetch('/balance');
      let result = await sendRequest.text();
      balanceOf.innerHTML = `${(+result/ Math.pow(10, 18)).toFixed(1)} ETH`;
    }catch(err){
      console.log(err);
    }
  }
  balanceSmartContract()

  //residual time function before the start of the lottery
  async function activeContract(){
    try{
      let sendRequest = await fetch('/timing');
      let result = await sendRequest.text();
      timerDeadline(parseInt(result));
    }catch(err){
      console.log(err);
    }
  }
  activeContract();

    //timer deadline lottery
  function timerDeadline(timeLeft){
    const fourthOfJuly = new Date().getTime() + timeLeft;
    let backTimer = setInterval(function(){
      const today = new Date().getTime();
      let diff=fourthOfJuly-today
      // math
      let days = Math.floor(diff / (1000 * 60 * 60 * 24));
      let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((diff % (1000 * 60))/1000);

      if(diff <= 0){
        clearInterval(backTimer);
        days = 0;
        hours = 0;
        minutes = 0;
        seconds = 0;
      }
      //paste on page
      timers[0].innerHTML = `${days} <p>Days</p>`;
      timers[2].innerHTML = `${hours} <p>Hour</p>`;
      timers[4].innerHTML = `${minutes} <p>Minutes</p>`;
      timers[6].innerHTML = `${seconds} <p>Seconds</p>`;
    }, 1000);
  }

  //Transfer Eth on contract
  butDeploy.addEventListener('click', async () => {
    if(isNaN(parseInt(valueEth.value)) || +valueEth.value <= 0){
      errorValid.innerHTML = 'Value can not be <= 0 or string';
    }else{
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', "application/x-www-form-urlencoded");
      //send request on server
      try{
        let transfer = await fetch('/transfer',{
          method: 'post',
          headers: myHeaders,
          body: `wallet = ${numWallet.value} & password = ${password.value} & value = ${valueEth.value}`
        });
        //response server recieve contract and transaction contract
        var result = await transfer.text();

        if(transfer.status == 403){
          errorValid.innerHTML = result;
        }else{
          let bool = Boolean(result);
          if(bool === false ){
            errorValid.innerHTML = '';
            active.innerHTML = "Lottery not active. Waiting for a transaction from the owner of the contract to start the lottery";
          }else{
            let jsonRes = JSON.parse(result);
            errorValid.innerHTML = jsonRes.success;
            balanceSmartContract();
          }
        }
          numWallet.value = "";
          password.value = "";
          valueEth.value = "";
      }catch(err){
        console.log(err)
        errorValid.innerHTML = 'Error retrieving data from server';
      }
    }
  })

  //display info lottery
  function displayInfo(){
    viewInformation.style.display = 'flex';
    viewInformation.style.flexWrap = 'wrap';
    viewInformation.style.justifyContent = 'center';
    viewInformation.style.alignItems = 'center';
    close.style.display = 'block'
  }

  //receive information information about the condition smart contract;
  lotteryInfo.addEventListener('click', async () => {
    displayInfo();
    let request = await fetch('/host/api/info');
    let response = await request.text();
    let info = JSON.parse(response);
    information.innerHTML = `Description: ${info.description}</br> Address Contract: ${info.addrContr}</br> Owner: ${info.owner}</br> Active Contract: ${info.active}`;
  })

  membersInfo.addEventListener('click', async () => {
    displayInfo();
    let request = await fetch('host/api/payments');
    let response = await request.text();
    let info = JSON.parse(response);
    information.innerHTML = '';

    for(let i = 0; i<info.length; i++){
      let p = document.createElement('p');
      p.innerHTML = `address: ${info[i][0]}</br> value WEI: ${info[i][1]}</br> dataTime: ${info[i][2]}`;
      information.appendChild(p);
    }
  })

  membersInactive.addEventListener('click', async () => {
    displayInfo();
    let request = await fetch('/host/api/inactive-payments');
    let response = await request.text();
    let info = JSON.parse(response);
    information.innerHTML = '';

    for(let i = 0; i<info.length; i++){
      let p = document.createElement('p');
      p.innerHTML = `address: ${info[i][0]}</br> value WEI: ${info[i][1]}</br> dataTime: ${info[i][2]}`;
      information.appendChild(p);
    }
  })

  winner.addEventListener('click', async () => {
    displayInfo();
    let request = await fetch('/host/api/result');
    let response = await request.text();
    let info = JSON.parse(response);
    information.innerHTML = `address Winner: ${info[0]}</br> value WEI: ${info[1]}</br> dataTime:${info[2]}`;
  })
  close.addEventListener('click', () =>{
    viewInformation.style.display = 'none';
    close.style.display = 'none'
  })

  //restart lottery
  restart.addEventListener('click', async () => {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', "application/x-www-form-urlencoded");
    let transfer = await fetch('/restart',{
      method: 'post',
      headers: myHeaders,
      body: `wallet = ${passwordOwner.value}`
    });
    let result = await transfer.text();
    console.log(result)
  })

}