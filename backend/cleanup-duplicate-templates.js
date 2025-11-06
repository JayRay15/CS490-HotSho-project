import { connectDB } from "./src/utils/db.js";
import { CoverLetterTemplate } from "./src/models/CoverLetterTemplate.js";

async function cleanupDuplicateTemplates() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    
    console.log("Finding all users with cover letter templates...");
    
    // Get all unique userIds
    const userIds = await CoverLetterTemplate.distinct('userId');
    console.log(`Found ${userIds.length} users with templates`);
    
    let totalCleaned = 0;
    
    for (const userId of userIds) {
      // Find all default templates for this user
      const userDefaultTemplates = await CoverLetterTemplate.find({
        userId,
        industry: 'general',
        style: { $in: ['formal', 'modern', 'creative', 'technical', 'executive'] }
      }).sort({ createdAt: 1 }); // Sort by oldest first
      
      if (userDefaultTemplates.length === 0) {
        continue;
      }
      
      console.log(`\nUser ${userId}: Found ${userDefaultTemplates.length} default templates`);
      
      // Group by style and keep only the oldest one for each style
      const templatesByStyle = {};
      userDefaultTemplates.forEach(template => {
        if (!templatesByStyle[template.style]) {
          templatesByStyle[template.style] = template;
        }
      });
      
      // These are the templates to keep (one per style)
      const templatesToKeep = Object.values(templatesByStyle).map(t => t._id.toString());
      
      // Find duplicates to delete
      const duplicatesToDelete = userDefaultTemplates
        .filter(t => !templatesToKeep.includes(t._id.toString()))
        .map(t => t._id);
      
      if (duplicatesToDelete.length > 0) {
        const result = await CoverLetterTemplate.deleteMany({ 
          _id: { $in: duplicatesToDelete } 
        });
        console.log(`  ✓ Deleted ${result.deletedCount} duplicate templates`);
        totalCleaned += result.deletedCount;
        
        // Show what was kept
        Object.entries(templatesByStyle).forEach(([style, template]) => {
          console.log(`  ✓ Kept 1 ${style} template: "${template.name}"`);
        });
      } else {
        console.log(`  ✓ No duplicates found (${userDefaultTemplates.length} templates, all unique)`);
      }
    }
    
    console.log(`\n✅ Cleanup complete! Removed ${totalCleaned} duplicate templates total.`);
    console.log("\nEach user now has exactly 1 template per style (formal, modern, creative, technical, executive)");
    
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupDuplicateTemplates();
