#!/usr/bin/env bash
# Fallback script to strip provisioning profile settings from Pods project
# This ensures pod targets don't try to use the app's provisioning profile
set -euo pipefail
cd "$(dirname "$0")/.."
PODS_PBXPROJ="$(pwd)/Pods/Pods.xcodeproj/project.pbxproj"
if [ -f "$PODS_PBXPROJ" ]; then
  echo "Stripping provisioning profile settings from $PODS_PBXPROJ"
  if /usr/bin/sed -i.bak -E "s/PROVISIONING_PROFILE_SPECIFIER = [^;]+;//g" "$PODS_PBXPROJ"; then
    echo "Removed PROVISIONING_PROFILE_SPECIFIER settings"
  else
    echo "Warning: Failed to strip PROVISIONING_PROFILE_SPECIFIER settings"
  fi
  if /usr/bin/sed -i.bak -E "s/PROVISIONING_PROFILE = [^;]+;//g" "$PODS_PBXPROJ"; then
    echo "Removed PROVISIONING_PROFILE settings"
  else
    echo "Warning: Failed to strip PROVISIONING_PROFILE settings"
  fi
else
  echo "Pods project not found at $PODS_PBXPROJ - skipping"
fi
