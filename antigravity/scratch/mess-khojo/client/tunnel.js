import localtunnel from 'localtunnel';
import fs from 'fs';

async function startTunnel() {
  try {
    console.log('Connecting to localtunnel...');
    const tunnel = await localtunnel({ port: 5173 });

    console.log(`Tunnel URL: ${tunnel.url}`);
    fs.writeFileSync('tunnel_url.txt', tunnel.url, 'utf8');

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 5 seconds...');
      setTimeout(startTunnel, 5000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
      setTimeout(startTunnel, 5000);
    });
  } catch (err) {
    console.error('Error opening tunnel:', err);
    fs.writeFileSync('tunnel_url.txt', `ERROR: ${err.message}`, 'utf8');
    setTimeout(startTunnel, 5000);
  }
}

// Keep the Node event loop alive
setInterval(() => {}, 1000 * 60 * 60);

startTunnel();
