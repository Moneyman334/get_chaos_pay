#!/usr/bin/env bash
set -euo pipefail
PODS_PBXPROJ="$(pwd)/Pods/Pods.xcodeproj/project.pbxproj"
if [ -f "$PODS_PBXPROJ" ]; then
  echo "Stripping provisioning profile settings from $PODS_PBXPROJ"
  # Remove entire lines containing PROVISIONING_PROFILE_SPECIFIER and PROVISIONING_PROFILE
  /usr/bin/sed -i.bak -E "/PROVISIONING_PROFILE_SPECIFIER = /d" "$PODS_PBXPROJ"
  /usr/bin/sed -i.bak -E "/PROVISIONING_PROFILE = /d" "$PODS_PBXPROJ"
fi
