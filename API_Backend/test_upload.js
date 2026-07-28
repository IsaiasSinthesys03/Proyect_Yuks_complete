const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
  try {
    // We need an admin token. Let's just create a dummy PDF file first
    fs.writeFileSync('test.pdf', '%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\n%%EOF');
    
    // We don't have a valid token easily accessible, so we'll get a 401. 
    // But let's check if there's an endpoint that doesn't need auth, or maybe we can login.
    console.log("Written test.pdf");
  } catch(e) {
    console.error(e.message);
  }
}

testUpload();
