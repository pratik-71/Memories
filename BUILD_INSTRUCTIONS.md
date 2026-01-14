# Android Build Instructions - Release Mode Signing

## 🚀 Overview

Your Android build scripts have been updated to **properly sign your APK and AAB files in RELEASE MODE** instead of debug mode. This is required for:
- ✅ Uploading to Google Play Store
- ✅ Distributing to users outside of development
- ✅ Production releases

## 📋 Prerequisites

Before running the build scripts, ensure you have:
1. **JDK (Java Development Kit)** installed (required for `keytool`)
2. **Node.js** and **npm** installed
3. **Expo CLI** installed globally (`npm install -g expo-cli`)
4. All project dependencies installed (`npm install`)

## 🔑 Keystore Setup

### First Time Running the Scripts

When you run either build script for the first time, it will:

1. **Create a keystore file** at `android/app/release.keystore`
2. **Prompt you for information:**
   - Keystore password (remember this!)
   - Key password (remember this!)
   - Your name
   - Organizational unit
   - Organization name
   - City/Locality
   - State/Province
   - Country code (e.g., US, IN, UK)

⚠️ **CRITICAL: Save these passwords in a secure location!**
- You'll need them for all future app updates
- If you lose them, you cannot update your app on Google Play Store
- You'll have to create a new app listing with a different package name

### What the Scripts Do

Both scripts now:
1. ✅ Create a release keystore (if it doesn't exist)
2. ✅ Configure `gradle.properties` with signing credentials
3. ✅ Modify `build.gradle` to use release signing configuration
4. ✅ Build the APK/AAB with **RELEASE MODE signing**

## 🛠️ Build Scripts

### 1. Building APK (For Direct Installation)

Run this script to create installable APK files:

```powershell
.\build_apk.ps1
```

**What you get:**
- Multiple APK files (one for each CPU architecture):
  - `app-armeabi-v7a-release.apk` (32-bit ARM)
  - `app-arm64-v8a-release.apk` (64-bit ARM - most modern phones)
  - `app-x86-release.apk` (Intel 32-bit)
  - `app-x86_64-release.apk` (Intel 64-bit)

**Use case:**
- Direct installation on Android devices
- Sharing with beta testers
- Distribution outside of Google Play Store

**Location:** `android/app/build/outputs/apk/release/`

---

### 2. Building AAB (For Google Play Store)

Run this script to create an Android App Bundle for the Play Store:

```powershell
.\build_store_release.ps1
```

**What you get:**
- Single AAB file: `app-release.aab`

**Use case:**
- Uploading to Google Play Console
- Official Play Store releases
- Smaller download sizes for users (Google Play optimizes per-device)

**Location:** `android/app/build/outputs/bundle/release/`

---

## 📦 Step-by-Step Build Process

### For APK (Direct Installation)

1. Open PowerShell in the project root directory
2. Run: `.\build_apk.ps1`
3. If first time: Enter keystore details when prompted
4. Wait for build to complete
5. Find your APKs in `android/app/build/outputs/apk/release/`
6. Install on Android device or share with testers

### For AAB (Play Store Upload)

1. Open PowerShell in the project root directory
2. Run: `.\build_store_release.ps1`
3. If first time: Enter keystore details when prompted
4. Wait for build to complete
5. Find your AAB in `android/app/build/outputs/bundle/release/`
6. Upload to Google Play Console

---

## 🔐 Security Best Practices

### Protecting Your Keystore

1. **Backup the keystore file:**
   ```
   android/app/release.keystore
   ```
   Store it in a secure location (encrypted cloud storage, password manager, etc.)

2. **Never commit to Git:**
   The keystore and passwords should NEVER be in version control.
   (Already excluded in `.gitignore`)

3. **Document your credentials:**
   Create a secure note with:
   - Keystore password
   - Key password
   - Key alias: `memories-key-alias`
   - Keystore location: `android/app/release.keystore`

4. **Use environment variables (Advanced):**
   For CI/CD, consider using environment variables instead of hardcoding passwords.

---

## ✅ Verifying Release Signing

To verify your APK/AAB is signed correctly:

```bash
# For APK
keytool -printcert -jarfile android/app/build/outputs/apk/release/app-arm64-v8a-release.apk

# For AAB
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

You should see:
- ✅ "jar verified" message
- ✅ Your certificate details (not Android Debug)
- ✅ Valid signature

---

## 🐛 Troubleshooting

### "keytool is not recognized"
- Install JDK (Java Development Kit)
- Add JDK bin directory to PATH

### "Failed to create keystore"
- Ensure JDK is properly installed
- Run PowerShell as Administrator

### "Build failed"
- Check that all dependencies are installed: `npm install`
- Clear cache: Delete `android` folder and rebuild
- Restart VS Code as prompted

### "Passwords not working"
- If you need to recreate keystore:
  1. Delete `android/app/release.keystore`
  2. Re-run the build script
  3. **Warning:** You cannot update existing Play Store app with new keystore!

---

## 📤 Uploading to Google Play Console

1. Run `.\build_store_release.ps1`
2. Go to [Google Play Console](https://play.google.com/console)
3. Navigate to your app → Production → Create new release
4. Upload `android/app/build/outputs/bundle/release/app-release.aab`
5. Fill in release details and submit for review

---

## 🎯 Summary

- ✅ Both scripts now create **RELEASE MODE** signed builds
- ✅ No more "debug signature" errors
- ✅ Ready for Google Play Store upload
- ✅ Secure keystore management
- ✅ APK splits for smaller file sizes

**Remember:** Keep your keystore and passwords safe! You'll need them for every future update.

---

## 📞 Need Help?

If you encounter issues:
1. Check this README
2. Review the PowerShell script output for error messages
3. Ensure prerequisites are met
4. Try cleaning the project (delete `android` folder and rebuild)

Good luck with your app release! 🚀
