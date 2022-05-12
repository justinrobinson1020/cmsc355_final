async function main(){const array = ['asdf', 'foo', 'bar'];
let users = [];
for (const id in array) {
  const response = await axios('/user/' + id);
  users.push(response);
}

console.log(users);}

main();