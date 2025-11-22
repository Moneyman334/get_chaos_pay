# iOS Build Guide for Apple App Store

## Prerequisites
1. **Mac Computer** (macOS required for iOS builds)
2. **Xcode 15+** installed from Mac App Store
3. **Apple Developer Account** ($99/year)
4. **Valid Bundle ID:** com.getchaospay.app

## Step 1: Apple Developer Setup

### Create App ID
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → **App**
5. Enter:
   - **Description:** Chaos Crypto Casino
   - **Bundle ID:** com.getchaospay.app (Explicit)
   - **Capabilities:** Enable as needed
6. Click **Continue** → **Register**

### Create Certificates
1. Go to **Certificates** → **+** button
2. Select **Apple Distribution** (for App Store)
3. Follow steps to generate CSR (Certificate Signing Request):
   - Open **Keychain Access** on Mac
   - Menu: Keychain Access → Certificate Assistant → Request Certificate from CA
   - Enter email, name, save to disk
4. Upload CSR → Download certificate
5. Double-click to install in Keychain

### Create Provisioning Profile
1. Go to **Profiles** → **+** button
2. Select **App Store**
3. Choose App ID: com.getchaospay.app
4. Select certificate created above
5. Name it: "Chaos Crypto Casino Distribution"
6. Download and install (double-click)

## Step 2: Configure Xcode Project

### Open Project
```bash
cd /path/to/chaos-crypto-casino
npm install
npm run build
npx cap sync ios
open ios/App/App.xcodeproj
```

### Configure Signing
1. In Xcode, select **App** target
2. Go to **Signing & Capabilities**
3. Uncheck **Automatically manage signing**
4. Select:
   - **Team:** Your Apple Developer Team
   - **Provisioning Profile:** Chaos Crypto Casino Distribution
   - **Signing Certificate:** Apple Distribution

### Set Version & Build
1. In **General** tab:
   - **Version:** 1.0
   - **Build:** 1
2. Update for each release (increment build number)

### Configure Info.plist
1. Add required privacy descriptions:
   - **NSCameraUsageDescription:** "Used to scan QR codes for wallet addresses"
   - **NSPhotoLibraryUsageDescription:** "Used to save receipts and QR codes"
   - **NSFaceIDUsageDescription:** "Used to secure your wallet access"

## Step 3: Build Archive

### Build for Release
1. Select **Any iOS Device (arm64)** as destination
2. Menu: **Product** → **Archive**
3. Wait for build to complete (5-10 minutes)
4. Archive Organizer will open automatically

### Validate Archive
1. Select your archive
2. Click **Validate App**
3. Choose **App Store Connect**
4. Select distribution certificate
5. Wait for validation (checks for errors)
6. Fix any issues and re-archive if needed

### Upload to App Store
1. Click **Distribute App**
2. Select **App Store Connect**
3. Click **Upload**
4. Follow prompts
5. Wait for upload to complete

## Step 4: App Store Connect Setup

### Create App Listing
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform:** iOS
   - **Name:** Chaos Crypto Casino
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.getchaospay.app
   - **SKU:** chaoscrypto-casino-001
   - **User Access:** Full Access

### Add App Information
1. **Category:**
   - **Primary:** Finance
   - **Secondary:** Utilities
2. **Age Rating:** Complete questionnaire (likely 17+)
3. **App Privacy:** Add privacy policy URL

### Add Version Information
1. Go to **App Store** tab → **Version 1.0**
2. Copy content from `store-assets/apple-app-store-listing.md`:
   - Promotional Text
   - Description
   - Keywords
   - Support URL
   - Marketing URL
3. Upload screenshots (see screenshot-requirements.md)
4. Upload app icon (1024x1024 PNG)

### Select Build
1. In **Build** section, click **+**
2. Select uploaded build from Step 3
3. Add export compliance info (likely "No" for encryption)

### Pricing & Availability
1. Set **Price:** Free
2. **Availability:** All countries (or select specific ones)

## Step 5: Submit for Review

### Complete Checklist
- [ ] All metadata filled in
- [ ] Screenshots uploaded (minimum 3)
- [ ] App icon uploaded
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Build selected and validated
- [ ] Age rating appropriate
- [ ] In-app purchases configured (if applicable)

### Submit
1. Click **Add for Review**
2. Fill in **App Review Information**:
   - Demo account credentials (if needed)
   - Review notes
   - Contact information
3. Check **Export Compliance** declaration
4. Click **Submit for Review**

## Step 6: Post-Submission

### Review Timeline
- **In Review:** 24-48 hours typically
- **First submission:** May take longer (up to 7 days)
- **Updates:** Faster (1-2 days)

### Possible Outcomes
1. **Approved** → App goes live automatically or on scheduled date
2. **Rejected** → Fix issues and resubmit
3. **Metadata Rejected** → Fix listing info only, no new build needed

### Common Rejection Reasons
- Privacy policy not accessible
- Demo account doesn't work
- Age rating incorrect
- Screenshots don't match functionality
- Cryptocurrency compliance issues

## Alternative: GitHub Actions (Automated)

### Setup Fastlane (Advanced)
1. Install Fastlane: `gem install fastlane`
2. Setup: `fastlane init`
3. Configure Matchfile for code signing
4. Create GitHub Actions workflow
5. Store certificates as GitHub secrets

This automates the entire build/upload process!

## Support Resources
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
