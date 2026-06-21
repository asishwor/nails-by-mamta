const fs = require('fs');
const path = require('path');

const propertiesPath = path.join(__dirname, '..', 'android', 'gradle.properties');

if (fs.existsSync(propertiesPath)) {
  console.log('Optimizing Android build sizes for EAS...');
  let content = fs.readFileSync(propertiesPath, 'utf8');
  
  // Drop emulator architectures (x86, x86_64) to save ~50% size
  content = content.replace(
    /reactNativeArchitectures=.*/g, 
    'reactNativeArchitectures=armeabi-v7a,arm64-v8a'
  );
  
  // Enable Proguard & Resource Shrinking
  content += '\nandroid.enableMinifyInReleaseBuilds=true\nandroid.enableShrinkResourcesInReleaseBuilds=true\n';
  
  fs.writeFileSync(propertiesPath, content);
  console.log('Successfully optimized gradle.properties!');
} else {
  console.log('Skipping Android size optimization because gradle.properties was not found (perhaps iOS build?).');
}
