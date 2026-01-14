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
cmd /c "rmdir /s /q android"

if (Test-Path "android") {
    Write-Warning "Could not delete 'android' folder. attempting regen anyway..."
}

Write-Host "Regenerating Android project (APK Configuration)..."
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

Write-Host "Enabling APK Splits (Reducing Size) and Release Signing..."
$buildGradlePath = "android\app\build.gradle"
if (Test-Path $buildGradlePath) {
    $content = Get-Content $buildGradlePath -Raw
    
    # Configure APK splits
    $splitConfig = @"
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
"@
    
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
    
    # Insert both blocks inside the 'android {' block
    $content = $content -replace "android \{", "android {`n$splitConfig`n$signingConfig"
    Set-Content -Path $buildGradlePath -Value $content
    
    Write-Host "Release signing configuration added to build.gradle"
}

Write-Host "Building Android APK (Installable on Phone)..."
cd android

# assembleRelease creates the .apk file
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed."
    exit 1
}

Write-Host "----------------------------------------------------------------"
Write-Host "BUILD SUCCESSFUL!"
Write-Host "Installable APK Files:"
Write-Host "  - android\app\build\outputs\apk\release\app-armeabi-v7a-release.apk"
Write-Host "  - android\app\build\outputs\apk\release\app-arm64-v8a-release.apk"
Write-Host "  - android\app\build\outputs\apk\release\app-x86-release.apk"
Write-Host "  - android\app\build\outputs\apk\release\app-x86_64-release.apk"
Write-Host ""
Write-Host "All APKs are PROPERLY SIGNED in RELEASE MODE with your keystore."
Write-Host "You can install these on devices or distribute them directly."
Write-Host "----------------------------------------------------------------"
