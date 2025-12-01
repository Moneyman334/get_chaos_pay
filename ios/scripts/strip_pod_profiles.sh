#!/usr/bin/env bash
# Fallback script to strip provisioning profile settings from Pods project
# This ensures pod targets don't try to use the app's provisioning profile
set -euo pipefail
cd "$(dirname "$0")/.."
PODS_PBXPROJ="$(pwd)/Pods/Pods.xcodeproj/project.pbxproj"
if [ -f "$PODS_PBXPROJ" ]; then
  echo "Stripping provisioning profile settings from $PODS_PBXPROJ"
  /usr/bin/sed -i.bak -E "s/PROVISIONING_PROFILE_SPECIFIER = [^;]+;//g" "$PODS_PBXPROJ" || true
  /usr/bin/sed -i.bak -E "s/PROVISIONING_PROFILE = [^;]+;//g" "$PODS_PBXPROJ" || true
fi
