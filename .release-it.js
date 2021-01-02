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
};
