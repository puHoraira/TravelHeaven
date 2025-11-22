// Quick test script for railway endpoints
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testRailwayEndpoints() {
  console.log('🧪 Testing Railway API Endpoints...\n');

  try {
    // Test 1: Get seat classes
    console.log('1. Testing /api/railway/seat-classes...');
    const seatClassesRes = await axios.get(`${BASE_URL}/railway/seat-classes`);
    console.log('✅ Seat classes:', seatClassesRes.data.data.length, 'classes available');
    console.log(JSON.stringify(seatClassesRes.data, null, 2));
    
    // Test 2: Get railway info
    console.log('\n2. Testing /api/railway/info...');
    const infoRes = await axios.get(`${BASE_URL}/railway/info`);
    console.log('✅ Railway info:', infoRes.data.data.provider);
    console.log(JSON.stringify(infoRes.data, null, 2));
    
    // Test 3: Search trains (example route)
    console.log('\n3. Testing /api/railway/search...');
    const searchRes = await axios.get(`${BASE_URL}/railway/search`, {
      params: {
        fromCity: 'Dhaka',
        toCity: 'Chittagong',
        date: '2025-11-25',
        seatClass: 'S_CHAIR'
      }
    });
    console.log('✅ Search results:', searchRes.data.data.totalTrains, 'trains found');
    console.log(JSON.stringify(searchRes.data, null, 2));
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testRailwayEndpoints();
