#!/bin/bash

echo "🔧 Rebuilding AAB with Google Play fix..."
echo ""

# Step 1: Commit and push the fix
echo "Step 1: Pushing manifest fix to GitHub..."
git add android/app/src/main/AndroidManifest.xml
git commit -m "fix: Add required Android features for Google Play distribution"
git push origin main

echo ""
echo "✅ Pushed to GitHub!"
echo ""
echo "⏱️  Wait 5-10 minutes for GitHub Actions to build the new AAB"
echo ""
echo "📥 Then download the new AAB from:"
echo "   https://github.com/Moneyman334/chaos-crypto-casino/actions"
echo ""
echo "📤 Finally, upload the new AAB to Google Play Console"
echo ""
echo "🎯 This will fix the 'required features' error!"
