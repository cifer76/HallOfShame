import { readFileSync, statSync, unlinkSync } from 'fs';
import { create as createTar } from 'tar';

const WALRUS_PUBLISHER_URL = process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_API_KEY = process.env.WALRUS_API_KEY;

async function deployToWalrus() {
  console.log('Building frontend...');
  
  // Run npm build (this would typically be done separately)
  console.log('Please ensure you have run: cd frontend && npm run build');
  
  const distPath = 'frontend/dist';
  
  // Verify dist folder exists
  try {
    const stats = statSync(distPath);
    if (!stats.isDirectory()) {
      throw new Error(`${distPath} is not a directory`);
    }
  } catch (error) {
    console.error(`Error: ${distPath} does not exist. Please build the frontend first.`);
    console.error('Run: cd frontend && npm run build');
    process.exit(1);
  }

  console.log('Creating tarball...');
  
  // Create tarball
  const tarPath = 'frontend/website.tar.gz';
  
  try {
    await createTar(
      { gzip: true, file: tarPath },
      [distPath.replace('frontend/', '')]
    );
  } catch (error) {
    console.error('Error creating tarball:', error);
    process.exit(1);
  }

  console.log('Uploading to Walrus...');
  
  // Read the tarball
  const fileData = readFileSync(tarPath);
  
  // Upload to Walrus
  const headers = {
    'Content-Type': 'application/octet-stream',
  };
  
  if (WALRUS_API_KEY) {
    headers['Authorization'] = `Bearer ${WALRUS_API_KEY}`;
  }

  try {
    const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/store`, {
      method: 'PUT',
      headers,
      body: fileData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    const blobId = result.newlyCreated?.blobObject.blobId || result.alreadyCertified?.blobId;
    
    if (!blobId) {
      throw new Error('No blob ID returned from Walrus');
    }

    console.log('\n✅ Successfully deployed to Walrus!');
    console.log(`📦 Blob ID: ${blobId}`);
    console.log(`🌐 Access URL: https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`);
    console.log('\n⚠️  Note: This is a tarball. You may need a gateway to extract and serve the content.');
    
    // Cleanup
    unlinkSync(tarPath);
    console.log('🧹 Cleaned up tarball');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployToWalrus().catch(console.error);
