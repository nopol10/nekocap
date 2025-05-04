module.exports = {
  git: {
    commit: true,
    changelog: true,
    requireCleanWorkingDir: false,
    tag: true,
    push: true,
    commitMessage: "chore: release ${version}",
  },
  npm: {
    publish: false,
  },
  plugins: {
    "@release-it/bumper": {
      in: [
        "extension-statics/manifest-chrome.json",
        "extension-statics/manifest-firefox.json",
      ],
      out: [
        "extension-statics/manifest-chrome.json",
        "extension-statics/manifest-firefox.json",
      ],
    },
    "@release-it/conventional-changelog": {
      preset: {
        name: "conventionalcommits",
      },
      infile: "CHANGELOG.md",
    },
  },
};
