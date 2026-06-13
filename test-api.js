async function main() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tharuntej7373@gmail.com', password: 'password123' }) // assuming this exists or I'll just get unauthorized
  });
  console.log('Login:', loginRes.status);
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Cookie:', cookie);

  const groupsRes = await fetch('http://localhost:3000/api/groups', {
    headers: { cookie }
  });
  const groups = await groupsRes.json();
  console.log('Groups:', groups);

  if (groups.groups && groups.groups.length > 0) {
    const groupId = groups.groups[0].id;
    console.log('Fetching expenses for', groupId);
    const expRes = await fetch(`http://localhost:3000/api/groups/${groupId}/expenses`, {
      headers: { cookie }
    });
    console.log('Expenses status:', expRes.status);
    const expData = await expRes.json();
    console.log('Expenses data:', expData);
  }
}
main();
