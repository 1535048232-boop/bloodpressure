#!/bin/bash

# Build and sync script for Blood Pressure App
echo "🩺 Blood Pressure App - Build & Sync Script"
echo "============================================="

# Step 1: Build the React app
echo "📦 Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ React build failed!"
    exit 1
fi

echo "✅ React build completed successfully!"

# Step 2: Sync to iOS
echo "📱 Syncing to iOS..."
npx cap sync ios

if [ $? -ne 0 ]; then
    echo "❌ iOS sync failed!"
else
    echo "✅ iOS sync completed successfully!"
fi

# Step 3: Sync to Android
echo "🤖 Syncing to Android..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Android sync failed!"
else
    echo "✅ Android sync completed successfully!"
fi

echo ""
echo "🎉 Build and sync completed!"
echo ""
echo "Next steps:"
echo "- iOS: npx cap open ios (requires Xcode)"
echo "- Android: npx cap open android (requires Android Studio)"
echo ""
echo "For device testing:"
echo "- iOS: npx cap run ios (requires iOS device/simulator)"
echo "- Android: npx cap run android (requires Android device/emulator)"