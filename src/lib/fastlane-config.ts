// ponytail: generate a Fastlane config + upload script for a given export zip.
// Apple App Store Connect API or Google Play Console — user pastes their credentials in the snippet.

type Body = {
  platform: "ios" | "android";
  appName: string;
  bundleId: string; // iOS: com.example.app, Android: com.example.app
  zipPath: string; // path to the export zip (relative)
  locales: string[]; // e.g. ["en", "ko", "ja"]
};

function escape(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function renderFastlaneSetup({ platform, appName, bundleId, zipPath, locales }: Body): string {
  const safeName = escape(appName);
  if (platform === "ios") {
    return `# Fastlane setup for ${appName} (${bundleId})
# ponytail: paste this into your iOS project root, then run \`bundle exec fastlane upload_screenshots\`

# Gemfile (add fastlane)
source "https://rubygems.org"
gem "fastlane"

# fastlane/Appfile
app_identifier "${bundleId}"
apple_id "your@email.com"  # App Store Connect email
team_id "XXXXXXXXXX"        # Apple Developer Team ID
itc_team_id "XXXXXXXXXX"    # App Store Connect Team ID

# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Upload screenshots to App Store Connect"
  lane :upload_screenshots do
    # ponytail: extract the zip Shotshot exported into fastlane/screenshots/
    sh "unzip -o ${zipPath} -d ./fastlane/screenshots/"

    # ponytail: this uploads all locales we exported
    deliver(
      submit_for_review: false,
      force: true,
      skip_binary_upload: true,
      skip_metadata: true,
      automatic_release: false,
      precheck_include_in_app_purchases: false,
      languages: ${JSON.stringify(locales)},
    )
  end
end

# Usage:
# 1. Create App Store Connect API key (.p8 file)
# 2. Set env: APP_STORE_CONNECT_API_KEY_PATH, APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID
# 3. Run: bundle exec fastlane upload_screenshots

# App Store Connect API setup:
# https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api
`;
  } else {
    return `# Fastlane setup for ${appName} (${bundleId})
# ponytail: paste this into your Android project root, then run \`bundle exec fastlane upload_screenshots\`

# Gemfile
source "https://rubygems.org"
gem "fastlane"

# fastlane/Appfile
json_key_file "./google-play-key.json"  # Service account JSON from Google Play Console
package_name "${bundleId}"

# fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Upload screenshots to Google Play"
  lane :upload_screenshots do
    # ponytail: extract the zip Shotshot exported into fastlane/metadata/android/
    sh "unzip -o ${zipPath} -d ./fastlane/metadata/android/"

    # ponytail: also handle Feature Graphic (1024x500) if present
    upload_to_play_store(
      track: "internal",  # change to "production" for release
      skip_upload_apk: true,
      skip_upload_aab: true,
      skip_upload_metadata: true,
      skip_upload_changelogs: true,
      skip_upload_images: false,
      validate_only: false,
    )
  end
end

# Usage:
# 1. Create Google Play Console service account
# 2. Download JSON key, save as ./google-play-key.json
# 3. Run: bundle exec fastlane upload_screenshots

# Service account setup:
# https://docs.fastlane.tools/actions/upload_to_play_store/#setup
`;
  }
}
