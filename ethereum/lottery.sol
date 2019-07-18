pragma solidity ^0.4.24;

library SafeMath {
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

contract MyLottery{
    
    using SafeMath for uint256;
    
    address public owner;
    uint public value;
    bool public activitySmartContr = true;
    uint public countLimitPlayer = 3;
    uint public numberWinner;
    uint public timeDeployContract;
    
    //info winner
    address public adrWinner;
    uint public winning;
    uint public adrWinnerTime;
    uint public countWinnerEth;

    constructor() public{
        owner = msg.sender;
        timeDeployContract = now;
    }
    
    struct User{
        address adrPlayer;
        uint ethCount;
        uint dateTime;
    }
    
    User[] public users;
    User[] public notActiveUser;
    
    function TransferEtherContract() public payable{                          // функция перевода средств на смарт контракт
        if(msg.sender == owner && activitySmartContr == false){
            startLottery();
        }else{
            require(msg.value > 0 && users.length < countLimitPlayer && activitySmartContr == true, 'End lottery');
            notActiveUser.push(User(msg.sender, msg.value, now));
            
            if(notActiveUser.length == 2 && msg.sender == notActiveUser[0].adrPlayer){
                notActiveUser[0].ethCount = notActiveUser[0].ethCount.add(msg.value);
                users.push(notActiveUser[0]);
                notActiveUser.length = 0;
            }else{
                for(uint i = 0; i < notActiveUser.length; i++){
                    if(msg.sender == notActiveUser[i].adrPlayer && notActiveUser.length > 1 && i != notActiveUser.length-1){
                        notActiveUser[i].ethCount = notActiveUser[i].ethCount.add(msg.value);
                    }
                    if(notActiveUser[i].ethCount >= 0.2 ether){
                        users.push(notActiveUser[i]);
                        removeUse(i);
                    }
                }
            }
            if(users.length == countLimitPlayer) activitySmartContr = false;
        }
    }
    
    function removeUse(uint _index) private{
        for(uint i = _index; i < notActiveUser.length-1; i++){
            notActiveUser[i] = notActiveUser[i+1];
        }
        if(notActiveUser.length >= 2 && notActiveUser[notActiveUser.length-1].adrPlayer == notActiveUser[notActiveUser.length-2].adrPlayer){
            delete notActiveUser[notActiveUser.length-1];
            notActiveUser.length = notActiveUser.length.sub(1);
        }
            delete notActiveUser[notActiveUser.length-1];
            notActiveUser.length = notActiveUser.length.sub(1);
    }

    //function start game lottery
    function startLottery() public{
        numberWinner = uint (blockhash(block.number-1))%10;
        if(users.length < numberWinner){
            numberWinner = users.length - 1;
        }
        uint balanceOut = address(this).balance - users[numberWinner].ethCount;
        countWinnerEth = address(this).balance/2;
        users[numberWinner].adrPlayer.transfer(balanceOut/2 + users[numberWinner].ethCount);
        winning = address(this).balance;

        owner.transfer(address(this).balance);
        adrWinner = users[numberWinner].adrPlayer;
        adrWinnerTime = now;
    }
    
    //change active smrt contract
    function changeActiveSmart(bool _active) public {
        require(msg.sender == owner, 'Not owner contract');
        activitySmartContr = _active;
    }
    
    //change count limit player
    function countLimitPlayers(uint _count) public{
        require(msg.sender == owner, "Not owner");
        countLimitPlayer = _count;
    }
        
    //recieve lenght player lottery
    function lengthUsers() public view returns (uint){
        return users.length;
    }

    //length inactive user
    function lengthInactiveUsers() public view returns (uint){
        return notActiveUser.length;
    }
    //receive data player who participate in the lottery
    function getUsers(uint _id) public view returns (address, uint, uint){
        return (users[_id].adrPlayer, users[_id].ethCount, users[_id].dateTime);
    }

    //info smart contract
    function infoContract() public view returns(address) {
        return owner;
    }

    //info inactive players
    function inactiveUser(uint _id) public view returns(address, uint, uint){
        return (notActiveUser[_id].adrPlayer, notActiveUser[_id].ethCount, notActiveUser[_id].dateTime);
    }

    //info winner lottery
    function getWinnerPlay() public view returns(address, uint, uint){
        return (adrWinner, countWinnerEth, adrWinnerTime);
    }

    //restart lottery
    function restartLottery() public{
        require(address(this).balance == 0 && msg.sender == owner, 'lottery active');
        users.length = 0;
        notActiveUser.length = 0;
        adrWinner = 0;
        numberWinner = 0;
        activitySmartContr = true;
    }
}