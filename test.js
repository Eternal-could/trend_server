const fs = require('fs');
let usersString = fs.readFileSync('db/users.json').toString();
const usersArray = JSON.parse(usersString);
console.log(usersArray)
console.log(usersArray instanceof Array)
// 写数据库
const user3 = {id:3,name:'afei',password:'yyy'};
usersArray.push(user3);
console.log(usersArray)
// 存入数据库
const usersString2 = JSON.stringify(usersArray);
fs.writeFileSync('db/users.json',usersString2);