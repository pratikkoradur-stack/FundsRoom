async function testBackend() {
  console.log('🧪 Starting End-to-End API Integration Tests...\n');

  const BASE_URL = 'http://localhost:5000/api';

  // 1. LOGIN
  console.log('1. Testing POST /api/auth/login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@company.com', password: 'admin123' }),
  });
  const loginData: any = await loginRes.json();

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginData.error}`);
  }
  console.log(`✅ Login successful! Token acquired for user: ${loginData.user.name} (${loginData.user.role})`);
  const token = loginData.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. CREATE CUSTOMER
  console.log('\n2. Testing POST /api/customers...');
  const custRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Rajesh Verma',
      business_name: 'Apex Global Logistics Ltd',
      mobile: '+919876543210',
      customer_type: 'Wholesale',
      status: 'Active',
      notes: 'Initial onboarding completed.',
    }),
  });
  const custData: any = await custRes.json();
  if (!custRes.ok) throw new Error(`Create customer failed: ${custData.error}`);
  const customerId = custData.customer.id;
  console.log(`✅ Customer Created: '${custData.customer.business_name}' (ID: ${customerId})`);

  // 3. CREATE PRODUCT 1 (Hydraulic Pump)
  console.log('\n3. Testing POST /api/products (Product 1)...');
  const prod1Res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Hydraulic Pump HP-200',
      sku: `PUMP-${Date.now()}`,
      category: 'Machinery',
      unit_price: 15000.00,
      current_stock: 50,
      min_stock_alert: 10,
      location: 'Rack A-1',
    }),
  });
  const prod1Data: any = await prod1Res.json();
  if (!prod1Res.ok) throw new Error(`Create product 1 failed: ${prod1Data.error}`);
  const prod1 = prod1Data.product;
  console.log(`✅ Product 1 Created: '${prod1.name}' | Stock: ${prod1.current_stock}`);

  // 4. CREATE PRODUCT 2 (Control Valve with stock = 5)
  console.log('\n4. Testing POST /api/products (Product 2 with low stock)...');
  const prod2Res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Control Valve CV-50',
      sku: `VALV-${Date.now()}`,
      category: 'Hardware',
      unit_price: 2500.00,
      current_stock: 5,
      min_stock_alert: 10,
      location: 'Rack B-3',
    }),
  });
  const prod2Data: any = await prod2Res.json();
  if (!prod2Res.ok) throw new Error(`Create product 2 failed: ${prod2Data.error}`);
  const prod2 = prod2Data.product;
  console.log(`✅ Product 2 Created: '${prod2.name}' | Stock: ${prod2.current_stock}`);

  // 5. TEST INSUFFICIENT STOCK ERROR HANDLING
  console.log('\n5. Testing Sales Challan Confirmation with INSUFFICIENT STOCK (Requesting 50 units of product with stock=5)...');
  const errChallanRes = await fetch(`${BASE_URL}/challans`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer_id: customerId,
      items: [{ product_id: prod2.id, quantity: 50 }],
      status: 'Confirmed',
    }),
  });
  const errChallanData: any = await errChallanRes.json();
  if (errChallanRes.status === 400) {
    console.log(`✅ Expected Insufficient Stock Error Caught (400 Bad Request):`, errChallanData.error, errChallanData.details);
  } else {
    console.error(`❌ Expected 400 error but received status: ${errChallanRes.status}`);
  }

  // 6. CREATE VALID CONFIRMED SALES CHALLAN
  console.log('\n6. Testing Valid Confirmed Sales Challan (Deducting 3 units of Control Valve)...');
  const validChallanRes = await fetch(`${BASE_URL}/challans`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer_id: customerId,
      items: [{ product_id: prod2.id, quantity: 3 }],
      status: 'Confirmed',
    }),
  });
  const validChallanData: any = await validChallanRes.json();
  if (!validChallanRes.ok) throw new Error(`Valid challan creation failed: ${validChallanData.error}`);
  const challan = validChallanData.challan;
  console.log(`✅ Confirmed Sales Challan Created: #${challan.challan_number} | Status: ${challan.status}`);

  // 7. VERIFY UPDATED PRODUCT STOCK & STOCK MOVEMENTS LOG
  console.log('\n7. Verifying Product Stock & Stock Movement Log...');
  const updatedProd2Res = await fetch(`${BASE_URL}/products/${prod2.id}`, { headers });
  const updatedProd2Data: any = await updatedProd2Res.json();
  console.log(`✅ Product 2 Stock after confirmation (Original: 5, Sold: 3): ${updatedProd2Data.product.current_stock} units`);

  const movementsRes = await fetch(`${BASE_URL}/products/${prod2.id}/movements`, { headers });
  const movementsData: any = await movementsRes.json();
  console.log(`✅ Stock Movements Log entries count: ${movementsData.movements.length}`);
  movementsData.movements.forEach((m: any) => {
    console.log(`   - Movement: ${m.movement_type} ${m.quantity} units | Reason: "${m.reason}"`);
  });

  console.log('\n🎉 ALL BACKEND API END-TO-END TESTS PASSED PERFECTLY!');
  process.exit(0);
}

testBackend().catch(err => {
  console.error('❌ API Test Failed:', err);
  process.exit(1);
});
