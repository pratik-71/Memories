Write-Host "Please make sure you have RESTARTED VS Code before running this if you had errors previously."
Start-Sleep -Seconds 3

Write-Host "Loading .env variables..."
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $name, $value = $line -split '=', 2
            if ($name -and $value) {
                [System.Environment]::SetEnvironmentVariable($name, $value, [System.EnvironmentVariableTarget]::Process)
                Write-Host "Loaded: $name"
            }
        }
    }
} else {
    Write-Warning ".env file not found!"
}

Write-Host "Killing processes..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "adb" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removing android folder..."
# Using CMD for robust deletion
cmd /c "rmdir /s /q android"

if (Test-Path "android") {
    Write-Warning "Could not delete 'android' folder. attempting regen anyway..."
}

Write-Host "Regenerating Android project (Play Store Configuration)..."
# Clean install
npx expo prebuild --platform android --clean

if ($LASTEXITCODE -ne 0) {
    Write-Error "Prebuild failed. Please Restart VS Code."
    exit 1
}

Write-Host "Configuring Gradle to prevent OOM..."
if (Test-Path "android\gradle.properties") {
    Add-Content -Path "android\gradle.properties" -Value "org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g"
    # Reduce workers to 1 to prevent Clang OOM
    Add-Content -Path "android\gradle.properties" -Value "org.gradle.workers.max=1"
    Add-Content -Path "android\gradle.properties" -Value "org.gradle.vfs.watch=false"
    # Enable R8 Shrinking for smaller APK size
    Add-Content -Path "android\gradle.properties" -Value "android.enableR8=true"
}

Write-Host "Configuring Release Signing..."
# Check if keystore exists, if not, create it
$keystorePath = "android\app\release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "Creating new keystore for release signing..."
    Write-Host "You will be prompted to enter keystore details."
    Write-Host "IMPORTANT: Remember the passwords and details you enter!"
    Write-Host "CRITICAL: Save these credentials in a safe place - you'll need them for future updates!"
    
    # Create keystore using keytool
    keytool -genkeypair -v -storetype PKCS12 -keystore $keystorePath -alias memories-key-alias -keyalg RSA -keysize 2048 -validity 10000
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create keystore. Make sure JDK is installed."
        exit 1
    }
}

# Add signing configuration to gradle.properties
if (Test-Path "android\gradle.properties") {
    Write-Host "Adding signing configuration to gradle.properties..."
    Add-Content -Path "android\gradle.properties" -Value ""
    Add-Content -Path "android\gradle.properties" -Value "# Release Signing Configuration"
    Add-Content -Path "android\gradle.properties" -Value "MYAPP_RELEASE_STORE_FILE=release.keystore"
    Add-Content -Path "android\gradle.properties" -Value "MYAPP_RELEASE_KEY_ALIAS=memories-key-alias"
    
    # Prompt for passwords
    $storePassword = Read-Host "Enter the keystore password" -AsSecureString
    $keyPassword = Read-Host "Enter the key password" -AsSecureString
    
    # Convert SecureString to plain text for gradle
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassword)
    $storePasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword)
    $keyPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    
    Add-Content -Path "android\gradle.properties" -Value "MYAPP_RELEASE_STORE_PASSWORD=$storePasswordPlain"
    Add-Content -Path "android\gradle.properties" -Value "MYAPP_RELEASE_KEY_PASSWORD=$keyPasswordPlain"
}

Write-Host "Configuring build.gradle for Release Signing..."
$buildGradlePath = "android\app\build.gradle"
if (Test-Path $buildGradlePath) {
    $content = Get-Content $buildGradlePath -Raw
    
    # Configure release signing
    $signingConfig = @"
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
"@
    
    # Insert signing config inside the 'android {' block
    $content = $content -replace "android \{", "android {`n$signingConfig"
    Set-Content -Path $buildGradlePath -Value $content
    
    Write-Host "Release signing configuration added to build.gradle"
}

Write-Host "Building Android App Bundle (AAB) for Play Store..."
cd android

# bundleRelease creates the .aab file
.\gradlew bundleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed."
    exit 1
}

Write-Host "----------------------------------------------------------------"
Write-Host "BUILD SUCCESSFUL!"
Write-Host "Play Store Bundle: android\app\build\outputs\bundle\release\app-release.aab"
Write-Host "This build is PROPERLY SIGNED with your release keystore."
Write-Host "You can upload this AAB directly to Google Play Console."
Write-Host "----------------------------------------------------------------"
