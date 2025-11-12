// Test if the analyzeExperienceForCoverLetter endpoint is properly registered
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function testEndpoint() {
  try {
    console.log('Importing coverLetterController...');
    const controller = await import('../src/controllers/coverLetterController.js');
    
    if (controller.analyzeExperienceForCoverLetter) {
      console.log('✅ analyzeExperienceForCoverLetter function exists in controller');
      console.log('Function type:', typeof controller.analyzeExperienceForCoverLetter);
    } else {
      console.log('❌ analyzeExperienceForCoverLetter function NOT found in controller');
      console.log('Available exports:', Object.keys(controller));
    }

    console.log('\nImporting coverLetterRoutes...');
    const routes = await import('../src/routes/coverLetterRoutes.js');
    console.log('✅ Routes imported successfully');
    console.log('Routes type:', typeof routes.default);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testEndpoint();
