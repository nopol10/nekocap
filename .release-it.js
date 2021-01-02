module.exports = {
  git: {
    commit: true,
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
      in: "extension-statics/manifest.json",
      out: "extension-statics/manifest.json",
    },
  },
};
