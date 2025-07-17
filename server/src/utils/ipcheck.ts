import os from 'os';

/**
 * Utilitaire pour afficher toutes les interfaces réseau et adresses IP disponibles
 * Pour aider à déboguer les problèmes d'adressage IPv6
 */
export function checkNetworkInterfaces() {
  const networkInterfaces = os.networkInterfaces();
  console.log('\n🌐 INTERFACES RÉSEAU DISPONIBLES:');
  console.log('=================================');
  
  for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    if (!interfaces) continue;
    
    console.log(`\n📡 Interface: ${name}`);
    interfaces.forEach((iface, idx) => {
      const family = iface.family === 'IPv6' ? '🟢 IPv6' : '🔵 IPv4';
      const internal = iface.internal ? '(interne)' : '(externe)';
      console.log(`  ${family} [${idx}]: ${iface.address} ${internal}`);
      
      if (iface.family === 'IPv6') {
        console.log(`    API Python: http://[${iface.address}]:5001`);
        console.log(`    WebSocket classique: ws://[${iface.address}]:5002`);
        console.log(`    WebSocket unifié: ws://[${iface.address}]:5003`);
        console.log(`    API Node: http://[${iface.address}]:5004`);
      } else {
        console.log(`    API Python: http://${iface.address}:5001`);
        console.log(`    WebSocket classique: ws://${iface.address}:5002`);
        console.log(`    WebSocket unifié: ws://${iface.address}:5003`);
        console.log(`    API Node: http://${iface.address}:5004`);
      }
    });
  }
  
  console.log('\n📍 ADRESSES SPÉCIALES:');
  console.log('=====================');
  console.log('  🔵 IPv4 localhost: http://127.0.0.1:5001 (API Python)');
  console.log('  🟢 IPv6 localhost: http://[::1]:5001 (API Python)');
  console.log('  🌐 Hostname local: http://localhost:5001 (API Python)');
  console.log('  🟦 WebSocket classique: ws://[::1]:5002');
  console.log('  🟪 WebSocket unifié: ws://[::1]:5003');
  console.log('  🟧 API Node: http://[::1]:5004');
  console.log('=================================\n');
}

export default checkNetworkInterfaces; 