// Script de test pour l'API client-documents en IPv6
import fetch from 'node-fetch';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlVSdnpUbjJoSUhXL2NXS2siLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2d2dmxzZ3R1YnFmeGR6dGxkdW5qLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyNTI3NGJhNi02N2U2LTQxNTEtOTAxYy03NDg1MWZlMmQ4MmEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyMjQ0MjAwLCJpYXQiOjE3NTIyNDA2MDAsImVtYWlsIjoiZ3JhbmRqZWFuLmxhcG9ydGVAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJhZGRyZXNzIjoiMTM0IGF2IGZvY2giLCJjaXR5IjoiU3QgTWF1ciBkZXMgRm9zc2VzIiwiY29tcGFueV9uYW1lIjoiUHJvZml0dW0gU0FTIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX251bWJlciI6IjA2NTgwNzI0NDUiLCJwb3N0YWxfY29kZSI6Ijk0MTAwIiwic2lyZW4iOiIxMjM0NTY3ODkiLCJ0eXBlIjoiY2xpZW50IiwidXNlcm5hbWUiOiJBbGV4YW5kcmUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1MjI0MDYwMH1dLCJzZXNzaW9uX2lkIjoiNDIzOTA3NmItMWYyMi00YzRhLWJiYTktMWUwNjllOWVjMGUyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.zLcI5O8aqysVYj97Js34oiSXCCxax9J4tk3yJfr2zvc';

async function testClientDocumentsAPI() {
  console.log('🧪 Test de l\'API client-documents en IPv6...');
  
  try {
    // Test 1: Endpoint de test simple
    console.log('\n1️⃣ Test de l\'endpoint /test...');
    const testResponse = await fetch('http://[::1]:5001/api/client-documents/test');
    console.log('Status:', testResponse.status);
    console.log('Headers:', testResponse.headers.get('content-type'));
    
    if (testResponse.ok) {
      const testData = await testResponse.text();
      console.log('Réponse:', testData.substring(0, 200) + '...');
    }
    
    // Test 2: Endpoint client avec authentification
    console.log('\n2️⃣ Test de l\'endpoint /client/:id avec JWT...');
    const clientResponse = await fetch('http://[::1]:5001/api/client-documents/client/25274ba6-67e6-4151-901c-74851fe2d82a', {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    console.log('Status:', clientResponse.status);
    console.log('Headers:', clientResponse.headers.get('content-type'));
    
    const clientData = await clientResponse.text();
    console.log('Réponse:', clientData.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testClientDocumentsAPI(); 